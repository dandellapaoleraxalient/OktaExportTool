const ExcelJS = require('exceljs');
const json2csv = require('json2csv');
const fs = require('fs').promises;
const path = require('path');
const moment = require('moment');

class ReportService {
  constructor() {
    this.reportsDir = path.join(__dirname, '../../reports');
    this.ensureReportsDirectory();
  }

  async ensureReportsDirectory() {
    try {
      await fs.access(this.reportsDir);
    } catch {
      await fs.mkdir(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate Excel report
   * @param {Object} data - Data to export
   * @param {string} type - Type of export (users, groups, applications, all)
   * @returns {Promise<string>} File path of generated report
   */
  async generateExcelReport(data, type = 'all') {
    const workbook = new ExcelJS.Workbook();
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const fileName = `okta-export-${type}-${timestamp}.xlsx`;
    const filePath = path.join(this.reportsDir, fileName);

    // Set workbook properties
    workbook.creator = 'Okta Export Tool';
    workbook.created = new Date();

    if (type === 'all' || type === 'users') {
      await this.addUsersSheet(workbook, data.users || data);
    }

    if (type === 'all' || type === 'groups') {
      await this.addGroupsSheet(workbook, data.groups || data);
    }

    if (type === 'all' || type === 'applications') {
      await this.addApplicationsSheet(workbook, data.applications || data);
    }

    if (type === 'all' && data.summary) {
      await this.addSummarySheet(workbook, data.summary);
    }

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  /**
   * Generate CSV report
   * @param {Object} data - Data to export
   * @param {string} type - Type of export
   * @returns {Promise<string>} File path of generated report
   */
  async generateCsvReport(data, type = 'all') {
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    let filePath;
    
    if (type === 'users' || (type === 'all' && data.users)) {
      const fileName = `okta-users-${timestamp}.csv`;
      filePath = path.join(this.reportsDir, fileName);
      const csv = this.convertToCSV(data.users || data);
      await fs.writeFile(filePath, csv);
    } else if (type === 'groups' || (type === 'all' && data.groups)) {
      const fileName = `okta-groups-${timestamp}.csv`;
      filePath = path.join(this.reportsDir, fileName);
      const csv = this.convertToCSV(data.groups || data);
      await fs.writeFile(filePath, csv);
    } else if (type === 'applications' || (type === 'all' && data.applications)) {
      const fileName = `okta-applications-${timestamp}.csv`;
      filePath = path.join(this.reportsDir, fileName);
      const csv = this.convertToCSV(data.applications || data);
      await fs.writeFile(filePath, csv);
    }

    return filePath;
  }

  /**
   * Generate JSON report
   * @param {Object} data - Data to export
   * @param {string} type - Type of export
   * @returns {Promise<string>} File path of generated report
   */
  async generateJsonReport(data, type = 'all') {
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const fileName = `okta-export-${type}-${timestamp}.json`;
    const filePath = path.join(this.reportsDir, fileName);
    
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData);
    
    return filePath;
  }

  /**
   * Add users sheet to Excel workbook
   * @param {ExcelJS.Workbook} workbook - Excel workbook
   * @param {Array} users - Users data
   */
  async addUsersSheet(workbook, users) {
    const worksheet = workbook.addWorksheet('Users');
    
    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Display Name', key: 'displayName', width: 25 },
      { header: 'Login', key: 'login', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created', key: 'created', width: 20 },
      { header: 'Last Login', key: 'lastLogin', width: 20 },
      { header: 'Last Updated', key: 'lastUpdated', width: 20 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Title', key: 'title', width: 25 },
      { header: 'Manager', key: 'manager', width: 30 },
      { header: 'Mobile Phone', key: 'mobilePhone', width: 15 },
      { header: 'Primary Phone', key: 'primaryPhone', width: 15 },
      { header: 'Street Address', key: 'streetAddress', width: 30 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'State', key: 'state', width: 15 },
      { header: 'Zip Code', key: 'zipCode', width: 10 },
      { header: 'Country Code', key: 'countryCode', width: 15 }
    ];

    // Add data
    users.forEach(user => {
      worksheet.addRow({
        ...user,
        created: user.created ? moment(user.created).format('YYYY-MM-DD HH:mm:ss') : '',
        lastLogin: user.lastLogin ? moment(user.lastLogin).format('YYYY-MM-DD HH:mm:ss') : '',
        lastUpdated: user.lastUpdated ? moment(user.lastUpdated).format('YYYY-MM-DD HH:mm:ss') : ''
      });
    });

    this.styleWorksheet(worksheet);
  }

  /**
   * Add groups sheet to Excel workbook
   * @param {ExcelJS.Workbook} workbook - Excel workbook
   * @param {Array} groups - Groups data
   */
  async addGroupsSheet(workbook, groups) {
    const worksheet = workbook.addWorksheet('Groups');
    
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Member Count', key: 'memberCount', width: 15 },
      { header: 'Created', key: 'created', width: 20 },
      { header: 'Last Updated', key: 'lastUpdated', width: 20 }
    ];

    groups.forEach(group => {
      worksheet.addRow({
        ...group,
        memberCount: group.members ? group.members.length : 0,
        created: group.created ? moment(group.created).format('YYYY-MM-DD HH:mm:ss') : '',
        lastUpdated: group.lastUpdated ? moment(group.lastUpdated).format('YYYY-MM-DD HH:mm:ss') : ''
      });
    });

    this.styleWorksheet(worksheet);

    // Add group members sheet
    if (groups.some(g => g.members && g.members.length > 0)) {
      const membersWorksheet = workbook.addWorksheet('Group Members');
      
      membersWorksheet.columns = [
        { header: 'Group ID', key: 'groupId', width: 25 },
        { header: 'Group Name', key: 'groupName', width: 30 },
        { header: 'User ID', key: 'userId', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'First Name', key: 'firstName', width: 20 },
        { header: 'Last Name', key: 'lastName', width: 20 }
      ];

      groups.forEach(group => {
        if (group.members) {
          group.members.forEach(member => {
            membersWorksheet.addRow({
              groupId: group.id,
              groupName: group.name,
              userId: member.id,
              email: member.email,
              firstName: member.firstName,
              lastName: member.lastName
            });
          });
        }
      });

      this.styleWorksheet(membersWorksheet);
    }
  }

  /**
   * Add applications sheet to Excel workbook
   * @param {ExcelJS.Workbook} workbook - Excel workbook
   * @param {Array} applications - Applications data
   */
  async addApplicationsSheet(workbook, applications) {
    const worksheet = workbook.addWorksheet('Applications');
    
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Label', key: 'label', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Sign On Mode', key: 'signOnMode', width: 20 },
      { header: 'Created', key: 'created', width: 20 },
      { header: 'Last Updated', key: 'lastUpdated', width: 20 },
      { header: 'Features', key: 'features', width: 30 }
    ];

    applications.forEach(app => {
      worksheet.addRow({
        ...app,
        features: Array.isArray(app.features) ? app.features.join(', ') : app.features,
        created: app.created ? moment(app.created).format('YYYY-MM-DD HH:mm:ss') : '',
        lastUpdated: app.lastUpdated ? moment(app.lastUpdated).format('YYYY-MM-DD HH:mm:ss') : ''
      });
    });

    this.styleWorksheet(worksheet);
  }

  /**
   * Add summary sheet to Excel workbook
   * @param {ExcelJS.Workbook} workbook - Excel workbook
   * @param {Object} summary - Summary data
   */
  async addSummarySheet(workbook, summary) {
    const worksheet = workbook.addWorksheet('Summary');
    
    worksheet.addRow(['Okta Export Summary']);
    worksheet.addRow([]);
    worksheet.addRow(['Export Date:', moment(summary.exportDate).format('YYYY-MM-DD HH:mm:ss')]);
    worksheet.addRow(['Total Users:', summary.totalUsers]);
    worksheet.addRow(['Total Groups:', summary.totalGroups]);
    worksheet.addRow(['Total Applications:', summary.totalApplications]);

    // Style the summary
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getCell('A1').font.color = { argb: 'FFFFFFFF' };
    
    worksheet.getColumn('A').width = 20;
    worksheet.getColumn('B').width = 30;
  }

  /**
   * Style Excel worksheet
   * @param {ExcelJS.Worksheet} worksheet - Excel worksheet
   */
  styleWorksheet(worksheet) {
    // Style header row
    worksheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: worksheet.lastColumn.letter + '1'
    };

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  /**
   * Convert data to CSV format
   * @param {Array} data - Data array
   * @returns {string} CSV string
   */
  convertToCSV(data) {
    if (!data || data.length === 0) {
      return '';
    }

    // Transform data to handle dates and arrays
    const transformedData = data.map(item => {
      const newItem = { ...item };
      
      // Format dates
      if (newItem.created) newItem.created = moment(newItem.created).format('YYYY-MM-DD HH:mm:ss');
      if (newItem.lastLogin) newItem.lastLogin = moment(newItem.lastLogin).format('YYYY-MM-DD HH:mm:ss');
      if (newItem.lastUpdated) newItem.lastUpdated = moment(newItem.lastUpdated).format('YYYY-MM-DD HH:mm:ss');
      
      // Handle arrays
      if (Array.isArray(newItem.features)) newItem.features = newItem.features.join(', ');
      if (Array.isArray(newItem.members)) newItem.memberCount = newItem.members.length;
      
      return newItem;
    });

    try {
      return json2csv.parse(transformedData);
    } catch (error) {
      console.error('CSV conversion error:', error);
      return this.fallbackCSV(transformedData);
    }
  }

  /**
   * Fallback CSV conversion if json2csv fails
   * @param {Array} data - Data array
   * @returns {string} CSV string
   */
  fallbackCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }

  /**
   * Get list of generated reports
   * @returns {Promise<Array>} Array of report files
   */
  async getReports() {
    try {
      const files = await fs.readdir(this.reportsDir);
      const reportFiles = [];

      for (const file of files) {
        if (file.match(/\.(xlsx|csv|json)$/)) {
          const filePath = path.join(this.reportsDir, file);
          const stats = await fs.stat(filePath);
          reportFiles.push({
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          });
        }
      }

      return reportFiles.sort((a, b) => b.created - a.created);
    } catch (error) {
      return [];
    }
  }
}

module.exports = ReportService;
