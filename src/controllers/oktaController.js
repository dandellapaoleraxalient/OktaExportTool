const OktaService = require('../services/oktaService');
const ReportService = require('../services/reportService');
const path = require('path');

class OktaController {
  constructor() {
    this.oktaService = new OktaService();
    this.reportService = new ReportService();
  }

  /**
   * Export users
   */
  exportUsers = async (req, res) => {
    try {
      console.log('🔄 Starting user export...');
      const format = req.query.format || process.env.EXPORT_FORMAT || 'excel';
      
      const users = await this.oktaService.getAllUsers();
      console.log(`✅ Retrieved ${users.length} users`);

      let filePath;
      switch (format.toLowerCase()) {
        case 'csv':
          filePath = await this.reportService.generateCsvReport(users, 'users');
          break;
        case 'json':
          filePath = await this.reportService.generateJsonReport(users, 'users');
          break;
        default:
          filePath = await this.reportService.generateExcelReport({ users }, 'users');
      }

      console.log(`📄 Report generated: ${path.basename(filePath)}`);

      // Send file for download with explicit headers
      const filename = path.basename(filePath);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'json' ? 'application/json' : 
                    format === 'csv' ? 'text/csv' : 
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download report' });
          }
        } else {
          console.log(`✅ File sent successfully: ${filename}`);
        }
      });

    } catch (error) {
      console.error('❌ Export users error:', error.message);
      res.status(500).json({ 
        error: 'Failed to export users', 
        details: error.message 
      });
    }
  };

  /**
   * Export groups
   */
  exportGroups = async (req, res) => {
    try {
      console.log('🔄 Starting groups export...');
      const format = req.query.format || process.env.EXPORT_FORMAT || 'excel';
      
      const groups = await this.oktaService.getAllGroups();
      console.log(`✅ Retrieved ${groups.length} groups`);

      let filePath;
      switch (format.toLowerCase()) {
        case 'csv':
          filePath = await this.reportService.generateCsvReport(groups, 'groups');
          break;
        case 'json':
          filePath = await this.reportService.generateJsonReport(groups, 'groups');
          break;
        default:
          filePath = await this.reportService.generateExcelReport({ groups }, 'groups');
      }

      console.log(`📄 Report generated: ${path.basename(filePath)}`);

      res.download(filePath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(500).json({ error: 'Failed to download report' });
        }
      });

    } catch (error) {
      console.error('❌ Export groups error:', error.message);
      res.status(500).json({ 
        error: 'Failed to export groups', 
        details: error.message 
      });
    }
  };

  /**
   * Export applications
   */
  exportApplications = async (req, res) => {
    try {
      console.log('🔄 Starting applications export...');
      const format = req.query.format || process.env.EXPORT_FORMAT || 'excel';
      
      const applications = await this.oktaService.getAllApplications();
      console.log(`✅ Retrieved ${applications.length} applications`);

      let filePath;
      switch (format.toLowerCase()) {
        case 'csv':
          filePath = await this.reportService.generateCsvReport(applications, 'applications');
          break;
        case 'json':
          filePath = await this.reportService.generateJsonReport(applications, 'applications');
          break;
        default:
          filePath = await this.reportService.generateExcelReport({ applications }, 'applications');
      }

      console.log(`📄 Report generated: ${path.basename(filePath)}`);

      res.download(filePath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(500).json({ error: 'Failed to download report' });
        }
      });

    } catch (error) {
      console.error('❌ Export applications error:', error.message);
      res.status(500).json({ 
        error: 'Failed to export applications', 
        details: error.message 
      });
    }
  };

  /**
   * Export all data
   */
  exportAll = async (req, res) => {
    try {
      console.log('🔄 Starting complete export...');
      const format = req.query.format || process.env.EXPORT_FORMAT || 'excel';
      
      const allData = await this.oktaService.getAllData();
      console.log(`✅ Export complete: ${allData.summary.totalUsers} users, ${allData.summary.totalGroups} groups, ${allData.summary.totalApplications} applications`);

      let filePath;
      switch (format.toLowerCase()) {
        case 'csv':
          // For CSV, we'll create multiple files and zip them
          filePath = await this.reportService.generateCsvReport(allData, 'all');
          break;
        case 'json':
          filePath = await this.reportService.generateJsonReport(allData, 'all');
          break;
        default:
          filePath = await this.reportService.generateExcelReport(allData, 'all');
      }

      console.log(`📄 Complete report generated: ${path.basename(filePath)}`);

      res.download(filePath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(500).json({ error: 'Failed to download report' });
        }
      });

    } catch (error) {
      console.error('❌ Export all error:', error.message);
      res.status(500).json({ 
        error: 'Failed to export all data', 
        details: error.message 
      });
    }
  };

  /**
   * Get export status/info
   */
  getExportInfo = async (req, res) => {
    try {
      const reports = await this.reportService.getReports();
      
      res.json({
        message: 'Okta Export Service',
        availableFormats: ['excel', 'csv', 'json'],
        recentReports: reports.slice(0, 10),
        config: {
          oktaDomain: process.env.OKTA_DOMAIN || 'Not configured',
          includeDeactivatedUsers: process.env.INCLUDE_DEACTIVATED_USERS === 'true',
          maxResultsPerRequest: parseInt(process.env.MAX_RESULTS_PER_REQUEST) || 200,
          defaultFormat: process.env.EXPORT_FORMAT || 'excel'
        }
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get export info', 
        details: error.message 
      });
    }
  };
}

module.exports = new OktaController();
