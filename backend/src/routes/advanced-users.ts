// 🏢 Advanced User Management API Routes
// Multi-tenant user management endpoints

import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { advancedUserService } from '../services/advanced-user-service';
import type { AuthRequest } from '../types';

const router: express.Router = express.Router();

// ================================================================================
// ORGANIZATION MANAGEMENT
// ================================================================================

// Get current user's organization (fallback to companies table)
router.get('/organization', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user?.companyId) {
      return res.status(404).json({
        success: false,
        error: 'User not associated with organization'
      });
    }

    // Fallback: Use existing companies table instead of organizations
    try {
      const organization = await advancedUserService.getOrganization(user.companyId);
      if (organization) {
        return res.json({
          success: true,
          organization
        });
      }
    } catch (orgError) {
      console.log('Organizations table not available, using companies fallback');
    }

    // Fallback to companies table
    const { postgresDatabase } = await import('../models/postgres-database');
    const companies = await postgresDatabase.getCompanies();
    const company = companies.find(c => c.id === user.companyId);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // Map company to organization format
    const organization = {
      id: company.id,
      name: company.name,
      slug: company.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      businessId: company.businessId,
      taxId: company.taxId,
      address: company.address,
      phone: company.phone,
      email: company.email,
      subscriptionPlan: 'basic',
      subscriptionStatus: 'active',
      maxUsers: 50,
      maxVehicles: 100,
      settings: {},
      branding: {},
      createdAt: company.createdAt,
      updatedAt: company.updatedAt
    };

    res.json({
      success: true,
      organization
    });

  } catch (error) {
    console.error('❌ Error getting organization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get organization'
    });
  }
});

// Create new organization (super admin only)
router.post('/organizations', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const organizationData = req.body;
    const createdBy = req.user?.id;

    const organization = await advancedUserService.createOrganization(organizationData, createdBy);

    res.status(201).json({
      success: true,
      organization
    });

  } catch (error: unknown) {
    console.error('❌ Error creating organization:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error) || 'Failed to create organization'
    });
  }
});

// Update organization
router.put('/organization', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user?.companyId) {
      return res.status(404).json({
        success: false,
        error: 'User not associated with organization'
      });
    }

    const organizationData = req.body;
    const organization = await advancedUserService.updateOrganization(user.companyId, organizationData);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    res.json({
      success: true,
      organization
    });

  } catch (error) {
    console.error('❌ Error updating organization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update organization'
    });
  }
});

// Get organization statistics
router.get('/organization/stats', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user?.companyId) {
      return res.status(404).json({
        success: false,
        error: 'User not associated with organization'
      });
    }

    const stats = await advancedUserService.getOrganizationStats(user.companyId);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Error getting organization stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get organization stats'
    });
  }
});

// ================================================================================
// DEPARTMENT MANAGEMENT
// ================================================================================

// Get departments
router.get('/departments', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user?.companyId) {
      return res.status(404).json({
        success: false,
        error: 'User not associated with organization'
      });
    }

    const departments = await advancedUserService.getDepartmentsByOrganization(user.companyId);

    res.json({
      success: true,
      departments
    });

  } catch (error) {
    console.error('❌ Error getting departments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get departments'
    });
  }
});

// Create department
router.post('/departments', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user?.companyId) {
      return res.status(404).json({
        success: false,
        error: 'User not associated with organization'
      });
    }

    const departmentData = {
      ...req.body,
      organizationId: user.companyId
    };

    const department = await advancedUserService.createDepartment(departmentData);

    res.status(201).json({
      success: true,
      department
    });

  } catch (error: unknown) {
    console.error('❌ Error creating department:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error) || 'Failed to create department'
    });
  }
});

// Update department
router.put('/departments/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const departmentData = req.body;

    const department = await advancedUserService.updateDepartment(id, departmentData);

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    res.json({
      success: true,
      department
    });

  } catch (error) {
    console.error('❌ Error updating department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update department'
    });
  }
});

// ================================================================================
// ROLE MANAGEMENT
// ================================================================================

// Get roles
router.get('/roles', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user?.companyId) {
      return res.status(404).json({
        success: false,
        error: 'User not associated with organization'
      });
    }

    const roles = await advancedUserService.getRolesByOrganization(user.companyId);

    res.json({
      success: true,
      roles
    });

  } catch (error) {
    console.error('❌ Error getting roles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get roles'
    });
  }
});

// Create role
router.post('/roles', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user?.companyId) {
      return res.status(404).json({
        success: false,
        error: 'User not associated with organization'
      });
    }

    const roleData = {
      ...req.body,
      organizationId: user.companyId
    };

    const role = await advancedUserService.createRole(roleData, user.id);

    res.status(201).json({
      success: true,
      role
    });

  } catch (error: unknown) {
    console.error('❌ Error creating role:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error) || 'Failed to create role'
    });
  }
});

// Update role
router.put('/roles/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const roleData = req.body;

    const role = await advancedUserService.updateRole(id, roleData);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    res.json({
      success: true,
      role
    });

  } catch (error: unknown) {
    console.error('❌ Error updating role:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error) || 'Failed to update role'
    });
  }
});

// Delete role
router.delete('/roles/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const success = await advancedUserService.deleteRole(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Role not found or cannot be deleted'
      });
    }

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });

  } catch (error: unknown) {
    console.error('❌ Error deleting role:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error) || 'Failed to delete role'
    });
  }
});

// ================================================================================
// ADVANCED USER MANAGEMENT
// ================================================================================

// Get users in organization
router.get('/users', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    
    console.log('👥 Users GET - user:', { 
      role: user?.role,
      userId: user?.id,
      username: user?.username,
      platformId: user?.platformId,
      companyId: user?.companyId
    });
    
    // 🔐 PLATFORM FILTERING: Users with platformId see all platform users
    let users: Awaited<ReturnType<typeof advancedUserService.getUsersByOrganization>> = [];
    if (user?.platformId && user.role !== 'super_admin') {
      console.log('🌐 USERS: Platform filtering - loading all platform users for platform:', user.platformId);
      
      // Get all companies for this platform
      const { postgresDatabase } = await import('../models/postgres-database');
      const companies = await postgresDatabase.getCompanies();
      const platformCompanies = companies.filter(c => c.platformId === user.platformId);
      const platformCompanyIds = platformCompanies.map(c => c.id);
      
      console.log('🔍 USERS: Platform companies:', { platformId: user.platformId, companyCount: platformCompanies.length, companyNames: platformCompanies.map(c => c.name) });
      
      // 🚨 If no companies for this platform, return empty array (don't fallback to companyId)
      if (platformCompanyIds.length === 0) {
        console.log('⚠️ USERS: No companies found for platform, returning empty user list');
        users = [];
      } else {
        // Get all users from all platform companies
        const allUsers = await Promise.all(
          platformCompanyIds.map(companyId => 
            advancedUserService.getUsersByOrganization(companyId).catch(() => [])
          )
        );
        const rawUsers = allUsers.flat();
        
        // 🚨 STRICT FILTERING: Only include users whose organizationId matches platform companies
        users = rawUsers.filter(u => platformCompanyIds.includes(u.organizationId));
        
        console.log('🌐 USERS: Platform filter applied:', { 
          platformCompanyIds,
          rawUserCount: rawUsers.length,
          filteredUserCount: users.length,
          rejectedCount: rawUsers.length - users.length
        });
      }
    } else if (user?.role !== 'super_admin') {
      // Regular logic: get users for user's company only (if NO platformId)
      if (!user?.companyId) {
        return res.status(404).json({
          success: false,
          error: 'User not associated with organization'
        });
      }
      users = await advancedUserService.getUsersByOrganization(user.companyId);
    } else {
      // super_admin sees all users - but this would need to fetch from all organizations
      // For now, return empty to avoid showing wrong data
      users = [];
    }

    // Remove password hashes from response
    const safeUsers = users.map(u => {
      const { passwordHash, ...safeUser } = u;
      return safeUser;
    });
    
    // 🔍 DEBUG: Log first 3 users
    console.log('🔍 USERS SAMPLE (first 3):', safeUsers.slice(0, 3).map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      organizationId: u.organizationId
    })));

    res.json({
      success: true,
      users: safeUsers
    });

  } catch (error) {
    console.error('❌ Error getting users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
});

// Get user details
router.get('/users/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Users can view their own details, or admins/managers can view others
    if (id !== currentUser?.id && !['admin', 'manager'].includes(currentUser?.role || '')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const userDetails = await advancedUserService.getUserDetails(id);

    if (!userDetails) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: userDetails
    });

  } catch (error) {
    console.error('❌ Error getting user details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user details'
    });
  }
});

// Create user
router.post('/users', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.companyId) {
      return res.status(404).json({
        success: false,
        error: 'User not associated with organization'
      });
    }

    const userData = {
      ...req.body,
      organizationId: currentUser.companyId
    };

    const user = await advancedUserService.createAdvancedUser(userData, currentUser.id);

    // Remove password hash from response
    const { passwordHash, ...safeUser } = user;

    res.status(201).json({
      success: true,
      user: safeUser
    });

  } catch (error: unknown) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error) || 'Failed to create user'
    });
  }
});

// Update user
router.put('/users/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const userData = req.body;

    // Users can update their own profile, or admins can update others
    if (id !== currentUser?.id && currentUser?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Non-admins can't change role or sensitive fields
    if (id !== currentUser?.id || currentUser?.role !== 'admin') {
      delete userData.roleId;
      delete userData.isActive;
      delete userData.customPermissions;
      delete userData.salary;
    }

    const user = await advancedUserService.updateAdvancedUser(id, userData);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Remove password hash from response
    const { passwordHash, ...safeUser } = user;

    res.json({
      success: true,
      user: safeUser
    });

  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

// Change password
router.post('/users/:id/change-password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const currentUser = req.user;

    // Users can change their own password, or admins can change others
    if (id !== currentUser?.id && currentUser?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    const success = await advancedUserService.changeUserPassword(id, newPassword);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// Deactivate user
router.post('/users/:id/deactivate', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Prevent self-deactivation
    if (id === currentUser?.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate your own account'
      });
    }

    const success = await advancedUserService.deactivateUser(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('❌ Error deactivating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate user'
    });
  }
});

// ================================================================================
// ACTIVITY LOG
// ================================================================================

// Get activity log
router.get('/activity-log', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.companyId) {
      return res.status(404).json({
        success: false,
        error: 'User not associated with organization'
      });
    }

    const {
      userId,
      action,
      resourceType,
      startDate,
      endDate,
      limit = 100
    } = req.query;

    const filters = {
      userId: userId as string,
      action: action as string,
      resourceType: resourceType as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const activityLog = await advancedUserService.getActivityLog(
      currentUser.companyId,
      filters,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      activityLog
    });

  } catch (error) {
    console.error('❌ Error getting activity log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get activity log'
    });
  }
});

// ================================================================================
// TEAM MANAGEMENT
// ================================================================================

// Get teams
router.get('/teams', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user?.companyId) {
      return res.status(404).json({
        success: false,
        error: 'User not associated with organization'
      });
    }

    const teams = await advancedUserService.getTeamsByOrganization(user.companyId);

    res.json({
      success: true,
      teams
    });

  } catch (error) {
    console.error('❌ Error getting teams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get teams'
    });
  }
});

// Create team
router.post('/teams', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user?.companyId) {
      return res.status(404).json({
        success: false,
        error: 'User not associated with organization'
      });
    }

    const teamData = {
      ...req.body,
      organizationId: user.companyId
    };

    const team = await advancedUserService.createTeam(teamData, user.id);

    res.status(201).json({
      success: true,
      team
    });

  } catch (error: unknown) {
    console.error('❌ Error creating team:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error) || 'Failed to create team'
    });
  }
});

// Get team members
router.get('/teams/:id/members', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const members = await advancedUserService.getTeamMembers(id);

    res.json({
      success: true,
      members
    });

  } catch (error) {
    console.error('❌ Error getting team members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get team members'
    });
  }
});

// Add team member
router.post('/teams/:id/members', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { userId, role = 'member' } = req.body;

    const member = await advancedUserService.addTeamMember(id, userId, role);

    res.status(201).json({
      success: true,
      member
    });

  } catch (error: unknown) {
    console.error('❌ Error adding team member:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error) || 'Failed to add team member'
    });
  }
});

// ================================================================================
// PERMISSION CHECKING
// ================================================================================

// Check permission
router.post('/check-permission', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { resource, action } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const hasPermission = await advancedUserService.checkPermission(userId, resource, action);

    res.json({
      success: true,
      hasPermission
    });

  } catch (error) {
    console.error('❌ Error checking permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check permission'
    });
  }
});

// 🚀 GMAIL APPROACH: GET /api/advanced-users/paginated - Rýchle vyhľadávanie používateľov
router.get('/paginated', 
  authenticateToken,
  requireRole(['admin', 'company_admin']),
  async (req: AuthRequest, res) => {
    try {
      const { 
        page = 1, 
        limit = 50,
        search = '',
        role = 'all',
        company = 'all',
        status = 'all'
      } = req.query;

      console.log('👤 Users PAGINATED GET - params:', { 
        page, limit, search, role, company, status,
        requestingUserRole: req.user?.role, 
        requestingUserId: req.user?.id
      });

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Import database here to avoid circular dependencies
      const { postgresDatabase } = await import('../models/postgres-database');

      // Získaj paginated users s filtrami
      const result = await postgresDatabase.getUsersPaginated({
        limit: limitNum,
        offset,
        search: search as string,
        role: role as string,
        company: company as string,
        status: status as string,
        userId: req.user?.id,
        userRole: req.user?.role
      });

      console.log(`📊 Found ${result.users.length}/${result.total} users (page ${pageNum})`);

      res.json({
        success: true,
        data: {
          users: result.users,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(result.total / limitNum),
            totalItems: result.total,
            hasMore: (pageNum * limitNum) < result.total,
            itemsPerPage: limitNum
          }
        }
      });
    } catch (error) {
      console.error('Get paginated users error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní používateľov'
      });
    }
  }
);

export default router;
