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

    var cama_group_codes = ['6570','6920','6570CMH'];
    var dece_group_codes = ['ECE','ECELT','ECEOCCL','FLOA-ECE'];
    var dece_excluded_job_codes = ['6701C', '6701E'];
    var dece_observer_job_codes = ['4030','2757'];
    var eaa_group_codes = ['6710','6710TM','6852','6853','6853T','EASUPPLY','FLOA-EAA'];
    var eaa_excluded_job_codes = ['6700E','6700S'];
    var ess_group_codes = ['6690','6690THR','6690THRA','6691','6700','6700HSEC','6701'];
    var etfo_group_codes = ['5100','FLOA-ELM'];
    var osstf_contract_group_codes = ['5108','FLOA-SEC'];
    var osstf_ot_group_codes = ['5131S','5132S'];
    var pssp_group_codes = ['6300','6703COM','6703SPCH','6703SW','6703TEMP','FLOA-PSS'];
    var smaca_group_codes = ['6550','6854','6854T','CAFASST','CAFSUPPL'];
    var smaca_elementary_group_codes = ['6550','6854','6854T','CAFASST','CAFSUPPL'];
    var smaca_secondary_group_codes = ['6550','6854','6854T','CAFASST','CAFSUPPL'];

    const calculated_members = await calculateMembers(rows);
    const created_blobs = await parseMembers(calculated_members);

    return {
        status: 200,
        body: created_blobs
    };

    async function parseMembers(members) {
        create_blob_results = [];
        Object.getOwnPropertyNames(members).forEach(async function(group_slug) {
            create_blob_results.push(await createBlob(container, calculated_members, group_slug));
        });
        return create_blob_results;
    }

    async function createBlob(container, members, group_slug) {
        var blob_name = group_slug +'@wrdsb.ca.json';
        var memberships = JSON.stringify(members[group_slug]);
        return await uploadBlob(container, blob_name, memberships);
    }

    async function uploadBlob(container, blob_name, memberships) {
        blobService.createBlockBlobFromText(container, blob_name, memberships, function(error, result, response) {
            if (!error) {
                console.log(blob_name + ' uploaded');
                console.log(result);
                console.log(response);
                return result;
            } else {
                console.log(error);
                return error;
            }
        });
    }

    async function calculateMembers (rows) {
        var members = {};

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

                if (cama_group_codes.includes(group_code)) {
                    if (!members['cama']) {
                        members['cama'] = {};
                    }
                    members['cama'][email] = {
                        email:          email,
                        role:           "MEMBER",
                        status:         "ACTIVE",
                        type:           "USER",
                        groupKey:       'cama@wrdsb.ca'
                    };
                }

                //if (dece_group_codes.includes(group_code) && !dece_excluded_job_codes.includes(job_code)) {
                    //if (!members['dece']) {
                        //members['dece'] = {};
                    //}
                    //members['dece'][email] = {
                        //email:          email,
                        //role:           "MEMBER",
                        //status:         "ACTIVE",
                        //type:           "USER",
                        //groupKey:       'dece@wrdsb.ca'
                    //};
                //}

                if (dece_group_codes.includes(group_code) && !dece_excluded_job_codes.includes(job_code)) {
                    if (!members['dece-info']) {
                        members['dece-info'] = {};
                    }
                    members['dece-info'][email] = {
                        email:          email,
                        role:           "MEMBER",
                        status:         "ACTIVE",
                        type:           "USER",
                        groupKey:       'dece-info@wrdsb.ca'
                    };
                }

                if (dece_observer_job_codes.includes(job_code)) {
                    if (!members['dece-info']) {
                        members['dece-info'] = {};
                    }
                    members['dece-info'][email] = {
                        email:          email,
                        role:           "MEMBER",
                        status:         "ACTIVE",
                        type:           "USER",
                        groupKey:       'dece-info@wrdsb.ca'
                    };
                }

                if (eaa_group_codes.includes(group_code) && !eaa_excluded_job_codes.includes(job_code)) {
                    if (!members['eaa']) {
                        members['eaa'] = {};
                    }
                    members['eaa'][email] = {
                        email:          email,
                        role:           "MEMBER",
                        status:         "ACTIVE",
                        type:           "USER",
                        groupKey:       'eaa@wrdsb.ca'
                    };
                }

                if (ess_group_codes.includes(group_code)) {
                    if (!members['ess']) {
                        members['ess'] = {};
                    }
                    members['ess'][email] = {
                        email:          email,
                        role:           "MEMBER",
                        status:         "ACTIVE",
                        type:           "USER",
                        groupKey:       'ess@wrdsb.ca'
                    };
                }

                if (etfo_group_codes.includes(group_code)) {
                    if (!members['etfo']) {
                        members['etfo'] = {};
                    }
                    members['etfo'][email] = {
                        email:          email,
                        role:           "MEMBER",
                        status:         "ACTIVE",
                        type:           "USER",
                        groupKey:       'etfo@wrdsb.ca'
                    };
                }

                if (osstf_contract_group_codes.includes(group_code)) {
                    if (!members['osstf-contract']) {
                        members['osstf-contract'] = {};
                    }
                    members['osstf-contract'][email] = {
                        email:          email,
                        role:           "MEMBER",
                        status:         "ACTIVE",
                        type:           "USER",
                        groupKey:       'osstf-contract@wrdsb.ca'
                    };
                }

                if (osstf_ot_group_codes.includes(group_code)) {
                    if (!members['osstf-ot']) {
                        members['osstf-ot'] = {};
                    }
                    members['osstf-ot'][email] = {
                        email:          email,
                        role:           "MEMBER",
                        status:         "ACTIVE",
                        type:           "USER",
                        groupKey:       'osstf-ot@wrdsb.ca'
                    };
                }

                if (pssp_group_codes.includes(group_code)) {
                    if (!members['pssp']) {
                        members['pssp'] = {};
                    }
                    members['pssp'][email] = {
                        email:          email,
                        role:           "MEMBER",
                        status:         "ACTIVE",
                        type:           "USER",
                        groupKey:       'pssp@wrdsb.ca'
                    };
                }

                if (smaca_group_codes.includes(group_code)) {
                    if (!members['smaca']) {
                        members['smaca'] = {};
                    }
                    members['smaca'][email] = {
                        email:          email,
                        role:           "MEMBER",
                        status:         "ACTIVE",
                        type:           "USER",
                        groupKey:       'smaca@wrdsb.ca'
                    };
                }

                if (smaca_elementary_group_codes.includes(group_code) && panel == 'E') {
                    if (!members['smaca-elementary']) {
                        members['smaca-elementary'] = {};
                    }
                    members['smaca-elementary'][email] = {
                        email:          email,
                        role:           "MEMBER",
                        status:         "ACTIVE",
                        type:           "USER",
                        groupKey:       'smaca-elementary@wrdsb.ca'
                    };
                }

                if (smaca_secondary_group_codes.includes(group_code) && panel == 'S') {
                    if (!members['smaca-secondary']) {
                        members['smaca-secondary'] = {};
                    }
                    members['smaca-secondary'][email] = {
                        email:          email,
                        role:           "MEMBER",
                        status:         "ACTIVE",
                        type:           "USER",
                        groupKey:       'smaca-secondary@wrdsb.ca'
                    };
                }
            }
        });
        return members;
    }
}
