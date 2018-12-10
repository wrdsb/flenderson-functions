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
    members['all-staff'] = {};
    members['bereavements'] = {};
    members['retirements'] = {};
    members['severe-weather'] = {};
    members['staff-opportunities'] = {};

    rows.forEach(function(row) {
        if (row.EMAIL_ADDRESS 
            && !excluded_job_codes.includes(row.JOB_CODE)
            && activity_codes.includes(row.ACTIVITY_CODE)
        ) {

            var email = row.EMAIL_ADDRESS;

            members['all-staff'][email] = {
                email:          email,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       "all-staff@wrdsb.ca"
            };

            members['bereavements'][email] = {
                email:          email,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       "bereavements@wrdsb.ca"
            };

            members['retirements'][email] = {
                email:          email,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       "retirements@wrdsb.ca"
            };

            members['severe-weather'][email] = {
                email:          email,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       "severe-weather@wrdsb.ca"
            };

            members['staff-opportunities'][email] = {
                email:          email,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       "staff-opportunities@wrdsb.ca"
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
