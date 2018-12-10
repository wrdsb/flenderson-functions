module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z

    var azure = require('azure-storage');
    var blobService = azure.createBlobService(
        'wrdsbflenderson',
        process.env['wrdsbflenderson_STORAGE_KEY']
    );

    var container = 'groups-memberships-ipps';
    var rows = context.bindings.iamwpRaw;
    var excluded_job_codes = ['6106', '6118'];

    var members = {};
    var public_members = {};

    var admin_job_codes = ['5130', '5130SEP', '5130SEPU', '5130TEP', '5131', '5131SEVP', '5131TEVP', '5230', '5230SSP', '5230TSP', '5231', '5231SSVP', '5231SSVU', '5231TSVP'];
    var attendance_job_codes = ['5130', '5130SEP', '5130SEPU', '5130TEP', '5131', '5131SEVP', '5131TEVP', '5107ADSL', '5230', '5230SSP', '5230TSP', '5231', '5231SAL', '5231SSVP', '5231T', '5231TSAL', '5231TSVP', '1337', '1339', '1340', '1341', '1345', '1350', '1352', '1443', '1482', '1506', '1511', '1514', '1533', '1537', '1571', '1600', '6123LTHR'];
    var beforeafter_job_codes = ['1340', '5154', '5171', '5151', '5155', '5172', '5159', '5131TEVP', '5111', '7600ST', '5157', '5127', '5152', '5144', '5161', '5100DSL', '5198', '5100', '5130TEP', '5130', '7600SA', '5107ADSL', '5156', '5131', '5456', '5356', '8128SERT', '8128SSE', '8128ESL', '8126SERT', '8126ESL', '8128SE', '8126S', '8126SE', '8126CT', '8124', '8130', '1537', '1500', '1533', '4000', '4011', '4010', '4200', '4210', '4230', '4220', '4101', '6701C', '6701E', '4100', '5131SEVP', '5130SEP', '5130SEPU'];
    var courier_job_codes = ['5130', '5130SEP', '5130SEPU', '5130TEP', '5131', '5131SEVP', '5131TEVP', '5107ADSL', '5230', '5230SSP', '5230TSP', '5231', '5231SAL', '5231SSVP', '5231T', '5231TSAL', '5231TSVP', '1337', '1339', '1340', '1341', '1345', '1350', '1352', '1443', '1482', '1506', '1511', '1514', '1533', '1537', '1571', '1600', '6503', '6502A', '6502B', '6502C', '6512'];
    var easyconnect_job_codes = ['1533', '5130', '5130SEP', '5130SEPU', '5130TEP', '5131', '5131SEVP', '5131TEVP', '5230', '5230SSP', '5230TSP', '5231', '5231SSVP', '5231SSVU', '5231TSVP', '1600'];
    var its_job_codes = ['5130', '5130SEP', '5130SEPU', '5130TEP', '5131', '5131SEVP', '5131TEVP', '5230', '5230SSP', '5230TSP', '5231', '5231SSVP', '5231SSVU', '5231TSVP','1533','1600','1542','1350','6132LTHR'];
    var office_job_codes = ['5130', '5130SEP', '5130SEPU', '5130TEP', '5131', '5131SEVP', '5131TEVP', '5107ADSL', '5230', '5230SSP', '5230TSP', '5231', '5231SAL', '5231SSVP', '5231T', '5231TSAL', '5231TSVP', '1337', '1339', '1340', '1341', '1345', '1350', '1352', '1443', '1482', '1506', '1511', '1514', '1533', '1537', '1571', '1600','6123LTHR'];
    var orders_job_codes = ['5130', '5130SEP', '5130SEPU', '5130TEP', '5131', '5131SEVP', '5131TEVP', '5107ADSL', '5230', '5230SSP', '5230TSP', '5231', '5231SAL', '5231SSVP', '5231T', '5231TSAL', '5231TSVP', '1337', '1339', '1340', '1341', '1345', '1350', '1352', '1443', '1482', '1506', '1511', '1514', '1533', '1537', '1571', '1600'];
    var s4s_job_codes = ['5130', '5130SEPU', '5130TEP', '5131', '5131TEVP', '5152', '5221S', '5230', '5230SSP', '5230TSP', '5231', '5231SSVP', '5231SSVU', '5231TSVP', '8126SERT', '8127SERT', '8128SERT'];

    rows.forEach(function(row) {
        // If we're missing required fields, bail
        if (
                (!row.EMAIL_ADDRESS || !row.JOB_CODE || !row.EMP_GROUP_CODE || !row.LOCATION_CODE || !row.PANEL || !row.SCHOOL_CODE || !row.ACTIVITY_CODE)
                || !excluded_job_codes.includes(row.JOB_CODE)
                || !isNaN(row.SCHOOL_CODE)
            ) {
            return;
        }

        var email = row.EMAIL_ADDRESS;
        var job_code = row.JOB_CODE;
        var group_code = row.EMP_GROUP_CODE;
        var location_code = row.LOCATION_CODE;
        var panel = row.PANEL;
        var school_code = row.SCHOOL_CODE;
        var activity_code = row.ACTIVITY_CODE;

        if (!members[school_code]) {
            members[school_code] = {};
        
            members[school_code]['staff'] = {};
            members[school_code]['staff-discussion'] = {};
            members[school_code]['admin'] = {};
            members[school_code]['attendance'] = {};
            members[school_code]['beforeafter'] = {};
            members[school_code]['easyconnect'] = {};
            members[school_code]['itunes'] = {};
            members[school_code]['office'] = {};
            members[school_code]['orders'] = {};
            members[school_code]['s4s'] = {};
            members[school_code]['stswr'] = {};
            members[school_code]['its'] = {};
        }
        
        if (!public_members[school_code]) {
            public_members[school_code] = {};
        }

        if (admin_job_codes.includes(job_code)) {
            members[school_code]['staff'][email] = {
                email:          email,
                role:           "MANAGER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       school_code + '-staff@wrdsb.ca'
            };
        } else {
            members[school_code]['staff'][email] = {
                email:          email,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       school_code + '-staff@wrdsb.ca'
            };
        }
    
        if (office_job_codes.includes(job_code)) {
            members[school_code]['staff-discussion'][email] = {
                email:          email,
                role:           "MANAGER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       school_code + '-staff-discussion@wrdsb.ca'
            };
        }
        
        if (admin_job_codes.includes(job_code)) {
            members[school_code]['admin'][email] = {
                email:          email,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       school_code + '-admin@wrdsb.ca'
            };
        }
        
        if (attendance_job_codes.includes(job_code)) {
            members[school_code]['attendance'][email] = {
                email:          email,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       school_code + '-attendance@wrdsb.ca'
            };
        }
        
        if (beforeafter_job_codes.includes(job_code)) {
            members[school_code]['beforeafter'][email] = {
                email:          email,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       school_code + '-beforeafter@wrdsb.ca'
            };
        }
        
        if (easyconnect_job_codes.includes(job_code)) {
            members[school_code]['easyconnect'][email] = {
                email:          email,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       school_code + '-easyconnect@wrdsb.ca'
            };
        }
        
        if (its_job_codes.includes(job_code)) {
            members[school_code]['its'][email] = {
                email:          email,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       school_code + '-its@wrdsb.ca'
            };
        }
        
        if (admin_job_codes.includes(job_code)) {
            members[school_code]['itunes'][email] = {
                email:          email,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       school_code + '-itunes@wrdsb.ca'
            };
        }
        
        if (office_job_codes.includes(job_code)) {
            members[school_code]['office'][email] = {
                email:          email,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       school_code + '-office@wrdsb.ca'
            };
        }
        
        if (orders_job_codes.includes(job_code)) {
            members[school_code]['orders'][email] = {
                email:          email,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       school_code + '-orders@wrdsb.ca'
            };
        }
        
        if (s4s_job_codes.includes(job_code)) {
            members[school_code]['s4s'][email] = {
                email:          email,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       school_code + '-s4s@wrdsb.ca'
            };
        }
        
        if (office_job_codes.includes(job_code)) {
            members[school_code]['stswr'][email] = {
                email:          email,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       school_code + '-stswr@wrdsb.ca'
            };
        }
        
        if (office_job_codes.includes(job_code)) {
            public_members[school_code][email] = {
                email:          email,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       school_code + '@wrdsb.ca'
            };
        }
    });


    Object.getOwnPropertyNames(members).forEach(function (school_code) {
        Object.getOwnPropertyNames(members[school_code]).forEach(function (group_slug) {

            var blob_name = school_code +'-'+ group_slug +'@wrdsb.ca.json';
            var memberships = JSON.stringify(members[school_code][group_slug]);
            context.log(memberships);

            blobService.createBlockBlobFromText(container, blob_name, memberships, function(error, result, response) {
                if (!error) {
                    context.log(blob_name + ' uploaded');
                    context.log(result);
                    context.log(response);
                } else {
                    context.log(error);
                }
            });
        });
    });

    Object.getOwnPropertyNames(public_members).forEach(function (school_code) {
        var blob_name = school_code +'@wrdsb.ca.json';
        var memberships = JSON.stringify(public_members[school_code]);
        context.log(memberships);

        blobService.createBlockBlobFromText(container, blob_name, memberships, function(error, result, response) {
            if (!error) {
                    context.log(blob_name + ' uploaded');
                    context.log(result);
                    context.log(response);
            } else {
                    context.log(error);
            }
        });
    });

    context.res = {
        status: 200
    };
    context.done();
};
