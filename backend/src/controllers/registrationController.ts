import { Request, Response } from 'express';
import pool from '../db';
import { EventRegistrationInput } from '../types';

// Register for an event
export const registerForEvent = async (req: Request, res: Response) => {
    try {
        const { event_id, role_id } = req.body;
        const user_id = req.params.userId;

        console.log('Registration request received:', {
            userId: user_id,
            eventId: event_id,
            roleId: role_id,
            body: req.body
        });

        // Validation
        if (!event_id) {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        // Check if user exists
        const [users]: any = await pool.query('SELECT * FROM users WHERE id = ?', [user_id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if event exists
        const [events]: any = await pool.query('SELECT * FROM events WHERE id = ?', [event_id]);
        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check if already registered
        const [existingRegistrations]: any = await pool.query(
            'SELECT * FROM event_registrations WHERE user_id = ? AND event_id = ?',
            [user_id, event_id]
        );

        if (existingRegistrations.length > 0) {
            return res.status(400).json({ error: 'User already registered for this event' });
        }

        // If role_id is provided, check if role exists and has capacity
        let roleIdNum: number | null = null;
        if (role_id) {
            roleIdNum = typeof role_id === 'string' ? parseInt(role_id, 10) : role_id;
            if (roleIdNum === null || isNaN(roleIdNum)) {
                return res.status(400).json({ error: 'Invalid role ID format' });
            }

            console.log('Checking role:', roleIdNum);

            const [role]: any = await pool.query(
                'SELECT * FROM event_roles WHERE id = ? AND event_id = ?',
                [roleIdNum, event_id]
            );

            if (role.length === 0) {
                return res.status(404).json({ error: 'Role not found for this event' });
            }

            // Check if role has available capacity
            const [registrationCount]: any = await pool.query(
                'SELECT COUNT(*) as count FROM role_registrations WHERE event_id = ? AND role_id = ? AND status IN ("pending", "approved")',
                [event_id, roleIdNum]
            );

            console.log('Role capacity check:', {
                capacity: role[0].capacity,
                currentCount: registrationCount[0].count
            });

            if (registrationCount[0].count >= role[0].capacity) {
                return res.status(400).json({ error: 'This role is already at full capacity' });
            }
        }

        // Begin transaction to ensure data consistency
        await pool.query('START TRANSACTION');

        try {
            // Register for the event
            console.log('Inserting event registration:', user_id, event_id);
            const [result]: any = await pool.query(
                'INSERT INTO event_registrations (user_id, event_id) VALUES (?, ?)',
                [user_id, event_id]
            );

            // Always insert into role_registrations (role_id can be NULL)
            if (roleIdNum) {
                console.log('Inserting role registration:', user_id, event_id, roleIdNum);
                await pool.query(
                    'INSERT INTO role_registrations (user_id, event_id, role_id, status) VALUES (?, ?, ?, "pending")',
                    [user_id, event_id, roleIdNum]
                );
            } else {
                // Insert as attendant (no role)
                console.log('Inserting attendant registration (no role):', user_id, event_id);
                await pool.query(
                    'INSERT INTO role_registrations (user_id, event_id, role_id, status) VALUES (?, ?, NULL, "pending")',
                    [user_id, event_id]
                );
            }

            await pool.query('COMMIT');

            const registrationId = result.insertId;
            const [newRegistration]: any = await pool.query(
                'SELECT * FROM event_registrations WHERE id = ?',
                [registrationId]
            );

            // Get updated role information with available spots
            let updatedRoleInfo = null;
            if (roleIdNum) {
                const [roleInfo]: any = await pool.query(
                    `SELECT r.*, 
                     COUNT(rr.id) as filled_spots,
                     (r.capacity - COUNT(rr.id)) as available_spots
                     FROM event_roles r
                     LEFT JOIN role_registrations rr ON r.id = rr.role_id AND rr.status IN ('pending', 'approved')
                     WHERE r.id = ?
                     GROUP BY r.id`,
                    [roleIdNum]
                );
                if (roleInfo.length > 0) {
                    updatedRoleInfo = roleInfo[0];
                }
            }

            res.status(201).json({
                registration: newRegistration[0],
                role: updatedRoleInfo
            });
        } catch (err) {
            await pool.query('ROLLBACK');
            console.error('Transaction error:', err);
            throw err;
        }
    } catch (error) {
        console.error('Error registering for event:', error);
        let errorMessage = 'Failed to register for event';
        if (error instanceof Error) {
            errorMessage += `: ${error.message}`;
        }
        res.status(500).json({ error: errorMessage });
    }
};

// Cancel registration
export const cancelRegistration = async (req: Request, res: Response) => {
    try {
        const user_id = req.params.userId;
        const event_id = req.params.eventId;
        
        console.log('Cancellation request received:', {
            userId: req.params.userId,
            eventId: req.params.eventId,
            authUser: (req as any).user?.id
        });

        // Check if registration exists
        const [registrations]: any = await pool.query(
            'SELECT * FROM event_registrations WHERE user_id = ? AND event_id = ?',
            [user_id, event_id]
        );

        if (registrations.length === 0) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        // Begin transaction
        await pool.query('START TRANSACTION');

        try {
            // Get any role registration (including attendant)
            const [roleRegistrations]: any = await pool.query(
                `SELECT rr.*, r.name as role_name, r.capacity 
                 FROM role_registrations rr 
                 LEFT JOIN event_roles r ON rr.role_id = r.id
                 WHERE rr.user_id = ? AND rr.event_id = ?`,
                [user_id, event_id]
            );

            let freedRole = null;

            // If there is a role (not attendant), store info for response
            if (roleRegistrations.length > 0 && roleRegistrations[0].role_id) {
                const roleReg = roleRegistrations[0];
                freedRole = {
                    id: roleReg.role_id,
                    name: roleReg.role_name,
                    capacity: roleReg.capacity
                };
            }

            // Always delete from role_registrations (covers both role and attendant)
            await pool.query(
                'DELETE FROM role_registrations WHERE user_id = ? AND event_id = ?',
                [user_id, event_id]
            );

            // Then delete the event registration
            await pool.query(
                'DELETE FROM event_registrations WHERE user_id = ? AND event_id = ?',
                [user_id, event_id]
            );

            await pool.query('COMMIT');

            // Get the updated role info if a role was freed
            if (freedRole) {
                const [updatedRoleInfo]: any = await pool.query(
                    `SELECT r.*, 
                     COUNT(rr.id) as filled_spots,
                     (r.capacity - COUNT(rr.id)) as available_spots
                     FROM event_roles r
                     LEFT JOIN role_registrations rr ON r.id = rr.role_id AND rr.status IN ('pending', 'approved')
                     WHERE r.id = ?
                     GROUP BY r.id`,
                    [freedRole.id]
                );
                
                if (updatedRoleInfo.length > 0) {
                    freedRole = {
                        ...freedRole,
                        ...updatedRoleInfo[0]
                    };
                }
            }

            res.json({ 
                message: 'Registration canceled successfully',
                freed_role: freedRole
            });
        } catch (err) {
            await pool.query('ROLLBACK');
            throw err;
        }
    } catch (error) {
        console.error('Error canceling registration:', error);
        res.status(500).json({ error: 'Failed to cancel registration' });
    }
};

// Get user's registered events
export const getUserRegistrations = async (req: Request, res: Response) => {
    try {
        const user_id = req.params.userId;

        // Check if user exists
        const [users]: any = await pool.query('SELECT * FROM users WHERE id = ?', [user_id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [registrations]: any = await pool.query(
            `SELECT e.*
            FROM events e
            JOIN event_registrations er ON e.id = er.event_id
            WHERE er.user_id = ?
            ORDER BY e.start_date`,
            [user_id]
        );

        res.json(registrations);
    } catch (error) {
        console.error('Error fetching user registrations:', error);
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
};

// Get all registrations for an event
export const getEventRegistrations = async (req: Request, res: Response) => {
    try {
        const event_id = req.params.eventId;

        // Check if event exists
        const [events]: any = await pool.query('SELECT * FROM events WHERE id = ?', [event_id]);
        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const [registrations]: any = await pool.query(
            `SELECT u.id, u.username, u.email, u.full_name, er.registration_date,
            COALESCE(rr.role_id, 0) as role_id, 
            COALESCE(r.name, 'General Participant') as role_name,
            rr.status as role_status
            FROM event_registrations er
            JOIN users u ON er.user_id = u.id
            LEFT JOIN role_registrations rr ON er.user_id = rr.user_id AND er.event_id = rr.event_id
            LEFT JOIN event_roles r ON rr.role_id = r.id
            WHERE er.event_id = ?
            ORDER BY er.registration_date DESC`,
            [event_id]
        );

        res.json(registrations);
    } catch (error) {
        console.error('Error fetching event registrations:', error);
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
};

// Add this new function to update a user's role for an event
export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const { event_id, role_id } = req.body;
        
        // Check if user is registered for this event
        const [eventRegistration]: any = await pool.query(
            'SELECT * FROM event_registrations WHERE user_id = ? AND event_id = ?',
            [userId, event_id]
        );
        
        if (eventRegistration.length === 0) {
            return res.status(404).json({ error: 'User is not registered for this event' });
        }
        
        // Check if role exists and has capacity
        const [role]: any = await pool.query(
            'SELECT * FROM event_roles WHERE id = ? AND event_id = ?',
            [role_id, event_id]
        );
        
        if (role.length === 0) {
            return res.status(404).json({ error: 'Role not found for this event' });
        }
        
        // Check if user already has this specific role
        const [existingRole]: any = await pool.query(
            'SELECT * FROM role_registrations WHERE user_id = ? AND event_id = ? AND role_id = ?',
            [userId, event_id, role_id]
        );
        
        if (existingRole.length > 0) {
            return res.status(400).json({ error: 'User already has this role for this event' });
        }
        
        // Check role capacity
        const [registrationCount]: any = await pool.query(
            'SELECT COUNT(*) as count FROM role_registrations WHERE event_id = ? AND role_id = ? AND status IN ("pending", "approved")',
            [event_id, role_id]
        );
        
        if (registrationCount[0].count >= role[0].capacity) {
            return res.status(400).json({ error: 'This role is already at full capacity' });
        }
        
        // Start a transaction
        await pool.query('START TRANSACTION');
        
        try {
            // First, remove any existing role
            await pool.query(
                'DELETE FROM role_registrations WHERE user_id = ? AND event_id = ?',
                [userId, event_id]
            );
            
            // Then add the new role
            await pool.query(
                'INSERT INTO role_registrations (user_id, event_id, role_id, status) VALUES (?, ?, ?, "pending")',
                [userId, event_id, role_id]
            );
            
            await pool.query('COMMIT');
            
            // Get updated role information
            const [updatedRoleInfo]: any = await pool.query(
                `SELECT r.*, 
                 COUNT(rr.id) as filled_spots,
                 (r.capacity - COUNT(rr.id)) as available_spots
                 FROM event_roles r
                 LEFT JOIN role_registrations rr ON r.id = rr.role_id AND rr.status IN ('pending', 'approved')
                 WHERE r.id = ?
                 GROUP BY r.id`,
                [role_id]
            );
            
            res.json({
                message: 'Role updated successfully',
                role: updatedRoleInfo[0]
            });
        } catch (err) {
            await pool.query('ROLLBACK');
            throw err;
        }
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
};