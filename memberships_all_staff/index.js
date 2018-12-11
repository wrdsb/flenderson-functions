module.exports = async function (context) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z
    var rows = context.bindings.iamwpRaw;

    var container = 'groups-memberships-ipps-now';
    var excluded_job_codes = ['6106', '6118'];
    var activity_codes = ['ACTIVE', 'ONLEAVE'];

    var azure = require('azure-storage');
    var blobService = azure.createBlobService(
        'wrdsbflenderson',
        process.env['wrdsbflenderson_STORAGE_KEY']
    );

    var groups = [
        'all-staff',
        'bereavements',
        'retirements',
        'severe-weather',
        'staff-opportunities'
    ];

    var members = [];

    rows.forEach(function(row) {
        if (row.EMAIL_ADDRESS 
            && !excluded_job_codes.includes(row.JOB_CODE)
            && activity_codes.includes(row.ACTIVITY_CODE)
        ) {
            members.push(row.EMAIL_ADDRESS);
        }
    });

    groups.forEach(function(group) {
        var blob_name = group +'@wrdsb.ca.json';
        var group_key = group +'@wrdsb.ca';
        var memberships = {};

        members.forEach(function(member) {
            memberships[member] = {
                email:          member,
                role:           "MEMBER",
                status:         "ACTIVE",
                type:           "USER",
                groupKey:       group_key
            };
        });

        memberships = JSON.stringify(memberships);

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
