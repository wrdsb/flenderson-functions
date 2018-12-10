module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z

    var azure = require('azure-storage');
    var blobService = azure.createBlobService(
        'wrdsbflenderson',
        process.env['wrdsbflenderson_STORAGE_KEY']
    );

    var container = 'groups-memberships-ipps-now';
    var rows = context.bindings.iamwpRaw;
    var excluded_job_codes = ['6106', '6118'];
    var activity_codes = ['ACTIVE', 'ONLEAVE'];

    var members = {};

    var elementary_admin_job_codes = ['5130', '5130SEP', '5130SEPU', '5130TEP', '5131', '5131SEVP', '5131TEVP', '5107ADSL', '5456'];
    var elementary_head_secretaries_job_codes = ['1533'];
    var elementary_c_secretaries_job_codes = ['1340'];
    var elementary_ot_teachers_job_codes = ['8124'];
    var elementary_teachers_group_codes = ['5100'];
    var elementary_staffing_support_job_codes = ['7600SA','5131','5130SEP','5130SEPU','5130','5131SEVP','5456','5130TEP','5156','5356','5107ADSL','5131TEVP','2228','2601','1453','6326','6305'];
    
    var secondary_admin_job_codes = ['5230', '5230SSP', '5230TSP', '5231', '5231SAL', '5231SSVP', '5231T', '5231TSAL', '5231TSVP'];
    var secondary_office_supervisors_job_codes = ['1600'];
    var secondary_office_assistants_job_codes = ['1506'];
    var secondary_c_secretaries_job_codes = ['1341','1337','1339','1350'];
    var secondary_teachers_group_codes = ['5108', 'FLOA-SEC'];
    var secondary_ot_teachers_group_codes = ['5131S', '5132S'];
    
    rows.forEach(function(row) {
        if (row.EMAIL_ADDRESS
            && row.JOB_CODE
            && row.EMP_GROUP_CODE
            && row.LOCATION_CODE
            && row.PANEL
            && row.SCHOOL_CODE
            && row.ACTIVITY_CODE
            && !excluded_job_codes.includes(row.JOB_CODE)
            && activity_codes.includes(row.ACTIVITY_CODE)
        ) {

            var email = row.EMAIL_ADDRESS;
            var job_code = row.JOB_CODE;
            var group_code = row.EMP_GROUP_CODE;
            var location_code = row.LOCATION_CODE;
            var panel = row.PANEL;
            var school_code = row.SCHOOL_CODE.toLowerCase();
            var activity_code = row.ACTIVITY_CODE;

            if (elementary_admin_job_codes.includes(job_code)) {
                if (!members['elementary-admin']) {
                    members['elementary-admin'] = {};
                }
                members['elementary-admin'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "elementary-admin@wrdsb.ca"
                };
            }
            
            if (elementary_head_secretaries_job_codes.includes(job_code)) {
                if (!members['elementary-head-secretaries']) {
                    members['elementary-head-secretaries'] = {};
                }
                members['elementary-head-secretaries'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "elementary-head-secretaries@wrdsb.ca"
                };
            }
            
            if (elementary_c_secretaries_job_codes.includes(job_code)) {
                if (!members['elementary-c-secretaries']) {
                    members['elementary-c-secretaries'] = {};
                }
                members['elementary-c-secretaries'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "elementary-c-secretaries@wrdsb.ca"
                };
            }
            
            if (elementary_teachers_group_codes.includes(group_code)) {
                if (!members['elementary-teachers']) {
                    members['elementary-teachers'] = {};
                }
                members['elementary-teachers'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "elementary-teachers@wrdsb.ca"
                };
            }
            
            if (elementary_ot_teachers_job_codes.includes(job_code)) {
                if (!members['elementary-ot-teachers']) {
                    members['elementary-ot-teachers'] = {};
                }
                members['elementary-ot-teachers'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "elementary-ot-teachers@wrdsb.ca"
                };
            }
            
            if (elementary_staffing_support_job_codes.includes(job_code)) {
                if (!members['elementary-staffing-support']) {
                    members['elementary-staffing-support'] = {};
                }
                members['elementary-staffing-support'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       'elementary-staffing-support@wrdsb.ca'
                };
            }
            
            if (secondary_admin_job_codes.includes(job_code)) {
                if (!members['secondary-admin']) {
                    members['secondary-admin'] = {};
                }
                members['secondary-admin'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "secondary-admin@wrdsb.ca"
                };
            }
            
            if (secondary_office_supervisors_job_codes.includes(job_code)) {
                if (!members['secondary-office-supervisors']) {
                    members['secondary-office-supervisors'] = {};
                }
                members['secondary-office-supervisors'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "secondary-office-supervisors@wrdsb.ca"
                };
            }
            
            if (secondary_office_assistants_job_codes.includes(job_code)) {
                if (!members['secondary-office-assistants']) {
                    members['secondary-office-assistants'] = {};
                }
                members['secondary-office-assistants'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "secondary-office-assistants@wrdsb.ca"
                };
            }
            
            if (secondary_c_secretaries_job_codes.includes(job_code)) {
                if (!members['secondary-c-secretaries']) {
                    members['secondary-c-secretaries'] = {};
                }
                members['secondary-c-secretaries'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "secondary-c-secretaries@wrdsb.ca"
                };
            }
            
            if (secondary_teachers_group_codes.includes(group_code)) {
                if (!members['secondary-teachers']) {
                    members['secondary-teachers'] = {};
                }
                members['secondary-teachers'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "secondary-teachers@wrdsb.ca"
                };
            }
            
            if (secondary_ot_teachers_group_codes.includes(group_code)) {
                if (!members['secondary-ot-teachers']) {
                    members['secondary-ot-teachers'] = {};
                }
                members['secondary-ot-teachers'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "secondary-ot-teachers@wrdsb.ca"
                };
            }
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
