const okta = require('@okta/okta-sdk-nodejs');

class OktaService {
  constructor() {
    this.client = new okta.Client({
      orgUrl: `https://${process.env.OKTA_DOMAIN}`,
      token: process.env.OKTA_API_TOKEN,
    });
  }

  /**
   * Get all users from Okta using raw API
   * @returns {Promise<Array>} Array of user objects
   */
  async getAllUsers() {
    try {
      const users = [];
      const includeDeactivated = process.env.INCLUDE_DEACTIVATED_USERS === 'true';
      
      let url = `https://${process.env.OKTA_DOMAIN}/api/v1/users`;
      const params = new URLSearchParams();
      params.append('limit', parseInt(process.env.MAX_RESULTS_PER_REQUEST) || 200);
      
      if (!includeDeactivated) {
        params.append('filter', 'status eq "ACTIVE"');
      }
      
      url += '?' + params.toString();
      console.log('🔍 Fetching users from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `SSWS ${process.env.OKTA_API_TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const userData = await response.json();
      console.log(`📊 Raw API returned ${userData.length} users`);
      
      for (const user of userData) {
        if (user && user.id) {
          console.log('📝 Processing user:', user.profile?.email || user.id);
          users.push(this.formatUser(user));
        }
      }

      console.log(`✅ Processed ${users.length} users`);
      return users;
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  /**
   * Get all groups from Okta using raw API
   * @returns {Promise<Array>} Array of group objects
   */
  async getAllGroups() {
    try {
      const groups = [];
      
      let url = `https://${process.env.OKTA_DOMAIN}/api/v1/groups`;
      const params = new URLSearchParams();
      params.append('limit', parseInt(process.env.MAX_RESULTS_PER_REQUEST) || 200);
      
      url += '?' + params.toString();
      console.log('🔍 Fetching groups from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `SSWS ${process.env.OKTA_API_TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const groupData = await response.json();
      console.log(`📊 Raw API returned ${groupData.length} groups`);
      
      for (const group of groupData) {
        if (group && group.id) {
          console.log('📝 Processing group:', group.profile?.name || group.id);
          const formattedGroup = this.formatGroup(group);
          formattedGroup.members = await this.getGroupMembers(group.id);
          groups.push(formattedGroup);
        }
      }

      console.log(`✅ Processed ${groups.length} groups`);
      return groups;
    } catch (error) {
      throw new Error(`Failed to fetch groups: ${error.message}`);
    }
  }

  /**
   * Get all applications from Okta using raw API
   * @returns {Promise<Array>} Array of application objects
   */
  async getAllApplications() {
    try {
      const applications = [];
      
      let url = `https://${process.env.OKTA_DOMAIN}/api/v1/apps`;
      const params = new URLSearchParams();
      params.append('limit', parseInt(process.env.MAX_RESULTS_PER_REQUEST) || 200);
      
      url += '?' + params.toString();
      console.log('🔍 Fetching applications from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `SSWS ${process.env.OKTA_API_TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const appData = await response.json();
      console.log(`📊 Raw API returned ${appData.length} applications`);
      
      for (const app of appData) {
        if (app && app.id) {
          console.log('📝 Processing application:', app.name || app.label || app.id);
          applications.push(this.formatApplication(app));
        }
      }

      console.log(`✅ Processed ${applications.length} applications`);
      return applications;
    } catch (error) {
      throw new Error(`Failed to fetch applications: ${error.message}`);
    }
  }

  /**
   * Get group members using raw API
   * @param {string} groupId - Group ID
   * @returns {Promise<Array>} Array of user IDs
   */
  async getGroupMembers(groupId) {
    try {
      const members = [];
      
      const url = `https://${process.env.OKTA_DOMAIN}/api/v1/groups/${groupId}/users`;
      console.log('🔍 Fetching group members from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `SSWS ${process.env.OKTA_API_TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch members for group ${groupId}: HTTP ${response.status}`);
        return [];
      }
      
      const userData = await response.json();
      console.log(`📊 Group ${groupId} has ${userData.length} members`);
      
      for (const user of userData) {
        if (user && user.id && user.profile) {
          members.push({
            id: user.id,
            email: user.profile.email,
            firstName: user.profile.firstName,
            lastName: user.profile.lastName
          });
        }
      }

      return members;
    } catch (error) {
      console.warn(`Failed to fetch members for group ${groupId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Format user object for export
   * @param {Object} user - Okta user object
   * @returns {Object} Formatted user object
   */
  formatUser(user) {
    return {
      id: user.id,
      email: user.profile.email,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      displayName: user.profile.displayName,
      login: user.profile.login,
      status: user.status,
      created: user.created,
      lastLogin: user.lastLogin,
      lastUpdated: user.lastUpdated,
      department: user.profile.department,
      title: user.profile.title,
      manager: user.profile.manager,
      mobilePhone: user.profile.mobilePhone,
      primaryPhone: user.profile.primaryPhone,
      streetAddress: user.profile.streetAddress,
      city: user.profile.city,
      state: user.profile.state,
      zipCode: user.profile.zipCode,
      countryCode: user.profile.countryCode
    };
  }

  /**
   * Format group object for export
   * @param {Object} group - Okta group object
   * @returns {Object} Formatted group object
   */
  formatGroup(group) {
    return {
      id: group.id,
      name: group.profile.name,
      description: group.profile.description,
      type: group.type,
      created: group.created,
      lastUpdated: group.lastUpdated,
      lastMembershipUpdated: group.lastMembershipUpdated,
      memberCount: 0 // Will be updated when we get members
    };
  }

  /**
   * Format application object for export
   * @param {Object} app - Okta application object
   * @returns {Object} Formatted application object
   */
  formatApplication(app) {
    return {
      id: app.id,
      name: app.name,
      label: app.label,
      status: app.status,
      signOnMode: app.signOnMode,
      created: app.created,
      lastUpdated: app.lastUpdated,
      features: app.features,
      accessibility: app.accessibility
    };
  }

  /**
   * Get comprehensive Okta data
   * @returns {Promise<Object>} Object containing all Okta data
   */
  async getAllData() {
    try {
      console.log('📥 Fetching users...');
      const users = await this.getAllUsers();
      
      console.log('👥 Fetching groups...');
      const groups = await this.getAllGroups();
      
      console.log('📱 Fetching applications...');
      const applications = await this.getAllApplications();

      return {
        users,
        groups,
        applications,
        summary: {
          totalUsers: users.length,
          totalGroups: groups.length,
          totalApplications: applications.length,
          exportDate: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch all data: ${error.message}`);
    }
  }
}

module.exports = OktaService;
