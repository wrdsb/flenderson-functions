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

    var admissions_qna_job_codes = ['1337', '1339','1340', '1341','1506','1514','1533', '1600', '1700', '1711', '2758', '5130', '5130SEP', '5130SEPU', '5130TEP', '5131', '5131SEVP', '5131TEVP', '5230', '5230SSP', '5230TSP', '5231', '5231SSVP', '5231SSVU', '5231TSVP', '6140', '7140']
    var dece_staff_group_codes = ['ECE','FLOA-ECE'];
    var ea_staff_job_codes = ['6710','6710TM','6852','6853','6853T','EASUPPLY','FLOA-EAA']
    var ed_deployment_manager_job_codes = ['4030','1482','2757','1934'];
    var ed_deployment_member_job_codes = ['1533','1340','6229','6233','6249','6242','7600SA','6220','5131','6128E','6238','5130','6242E','8124','6237','4000','6230','6212','5456','6236','6244','6243ASD','5130TEP','8128SE','6234','6241E','5156','6247','8126SERT','5356','7249','5107ADSL','6246','6701C','8126SE','7233','8128ESL','7213','6128S','7242','7229','7236','7212','6239','8126S','4210','8126ESL','1500','1537','7238','4100','7243ASD','8128SERT','8130','7237','4010','7253','4101','6700E','7250','7244','7247','4200','8128SSE'];
    var ed_inquiries_job_codes = ['4030','1482','2757','1934','1453','2228'];
    var edc_location_codes = ['003', '168', '169', '170', '171', '228', '229', '230', '266', '267', '273', '277', '280', '285', '370', '371', '427', '455', '456', '457', '624', '626', '675', '690', '695', '730', '830', '831', '833', '834', '840', '862', '868', '946', 'WRDSB'];
    var elementary_serts_job_codes = ['5152','5252','5221S','8126SERT','8127SERT','8128SERT','8128SSE'];
    var finance_job_codes = ['4030'];
    var finance_location_codes = ['274', '281', '285'];
    var grc_health_safety_location_codes = ['330']; // 330 = GRC
    var itinerant_spec_ed_job_codes = ['5144', '5151', '5154'];
    var itinerant_spec_ed_location_codes = ['691'];
    var its_job_codes = ['1542', '1309', '1404', '1413', '1482', '1491', '1492', '1498', '1517', '1520', '1588', '1589', '1599', '1608', '1617', '1698', '1700', '1704', '1706', '1711', '1712', '1720', '1760', '1802', '1803', '1809', '1811', '1852', '1860', '1904', '1906', '1908', '1910', '1915', '1933', '2000', '2007','2303', '2560', '2563', '2572', '2701', '5127', '5172', '6132', '5227C'];
    var lars_communication_job_codes = ['1314','1340','5172','1345','1341','1498','1520','1517','1491','1309','1908','6123THR','6123','6132','5130', '5130SEP', '5130SEPU', '5130TEP', '5131', '5131SEVP', '5131TEVP', '5107ADSL','5222L','5230', '5230SSP', '5230TSP', '5231', '5231SAL', '5231SSVP', '5231T', '5231TSAL', '5231TSVP']
    var procurement_qna_job_codes = ['1237','1265','1301','1308','1309','1314','1337','1339','1340','1341','1342','1345','1350','1352','1355','1404','1407','1408','1413','1421','1440','1443','1453','1457','1475','1480','1482','1487','1490','1491','1492','1498','1500','1502','1503','1504','1506','1508','1511','1513','1514','1516','1517','1520','1533','1537','1542','1544','1571','1600','1623','1625','1638','1641','1654','1934','6123','6132','6123LTHR','6132LTHR','7009ILE','OYAP7001']
    var psychologists_job_codes = ['2430', '6804'];
    var school_day_job_codes = ['1533','1340','1600','1506','1337', '1341', '1352', '1345', '1339', '1350','5130', '5130SEP', '5130SEPU', '5130TEP', '5131', '5131SEVP', '5131TEVP', '5107ADSL','5230', '5230SSP', '5230TSP', '5231', '5231SAL', '5231SSVP', '5231T', '5231TSAL', '5231TSVP']
    var secondary_serts_job_codes = ['5152','5252','5221S','8126SERT','8127SERT','8128SERT','8128SSE'];
    var smaca_elementary_group_codes = ['6550','6854','6854T','CAFASST','CAFSUPPL'];
    var smaca_secondary_group_codes = ['6550','6854','6854T','CAFASST','CAFSUPPL'];
    var social_workers_job_codes = ['2603', '5156', '5233', '6140'];
    var special_education_location_codes = ['690', '691'];
    var special_education_consultants_job_codes = ['5156', '5157'];
    var speech_language_job_codes = ['2432', '6120', '6805'];
    var system_leaders_job_codes = ['1457','1503','1544','1571','1641','1657','1853','1926','2100','2101','2103','2105','2106','2107','2205','2206','2224','2227','2228','2300','2306','2400','2401','2402','2403','2404','2420','2431','2432','2440','2445','2510','2526','2561','2576','2577','2601','2603','2640','2700','2701','2702','2753','2754','2755','2756','2757','2758','2759','2761','2810','2811','4030','5130','5131','5156','5230','5231','5233','5249','5356','5456','6301','6305','6326','6334','5130TEP','5131SEVU','5131TEVP','5230TSP','5231TSVP','7600SA'];
    var thr_message_board_group_codes = ['6690THR']
    var trillium_job_codes = ['1600','1340','5271','5221G','1506','1623','1514','1482','5171','1339','1352','1533','1571','1337','1341','1711','1514']
    var twea_job_codes = ['5130', '5130SEP', '5130SEPU', '5130TEP', '5131', '5131SEVP', '5131TEVP', '5107ADSL', '5100', '5131E']
    var wrdsb_managers_job_codes = ['2100','2101','2103','2105','2106','2107','2205','2206','2224','2227','2228','2300','2303','2306','2400','2401','2402','2403','2404','2420','2430','2431','2432','2440','2445','2510','2526','2560','2561','2563','2572','2576','2577','2601','2603','2640','2700','2701','2702','2753','2754','2755','2756','2757','2758','2759','2761','2810','2811','4030','5233','6326'];
    
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

            if (admissions_qna_job_codes.includes(job_code)) {
                if (!members['admissions-qna']) {
                    members['admissions-qna'] = {};
                }
                members['admissions-qna'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "admissions-qna@wrdsb.ca"
                };
            }
            if (dece_staff_group_codes.includes(group_code)) {
                if (!members['dece-staff']) {
                    members['dece-staff'] = {};
                }
                members['dece-staff'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "dece-staff@wrdsb.ca"
                };
            }
            if (ea_staff_job_codes.includes(job_code)) {
                if (!members['ea-staff']) {
                    members['ea-staff'] = {};
                }
                members['ea-staff'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "ea-staff@wrdsb.ca"
                };
            }
            if (ed_deployment_manager_job_codes.includes(job_code)) {
                if (!members['ed-deployment']) {
                    members['ed-deployment'] = {};
                }
                members['ed-deployment'][email] = {
                    email:          email,
                    role:           "MANAGER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "ed-deployment@wrdsb.ca"
                };
            }
            if (ed_deployment_member_job_codes.includes(job_code)) {
                if (!members['ed-deployment']) {
                    members['ed-deployment'] = {};
                }
                members['ed-deployment'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "ed-deployment@wrdsb.ca"
                };
            }
            if (ed_inquiries_job_codes.includes(job_code)) {
                if (!members['ed-inquiries']) {
                    members['ed-inquiries'] = {};
                }
                members['ed-inquiries'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "ed-inquiries@wrdsb.ca"
                };
            }
            if (edc_location_codes.includes(location_code)) {
                if (!members['edc-staff']) {
                    members['edc-staff'] = {};
                }
                members['edc-staff'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       'edc-staff@wrdsb.ca'
                };
            }
            if (elementary_serts_job_codes.includes(job_code) && panel == 'E') {
                if (!members['elementary-serts']) {
                    members['elementary-serts'] = {};
                }
                members['elementary-serts'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "elementary-serts@wrdsb.ca"
                };
            }
            if (finance_job_codes.includes(job_code)) {
                if (!members['finance-staff']) {
                    members['finance-staff'] = {};
                }
                members['finance-staff'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       'finance-staff@wrdsb.ca'
                };
            }
            if (finance_location_codes.includes(location_code)) {
                if (!members['finance-staff']) {
                    members['finance-staff'] = {};
                }
                members['finance-staff'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       'finance-staff@wrdsb.ca'
                };
            }
            if (grc_health_safety_location_codes.includes(location_code)) {
                if (!members['grc-health-safety']) {
                    members['grc-health-safety'] = {};
                }
                members['grc-health-safety'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       'grc-health-safety@wrdsb.ca'
                };
            }
            if (itinerant_spec_ed_job_codes.includes(job_code) && itinerant_spec_ed_location_codes.includes(location_code)) {
                if (!members['itinerant-spec-ed']) {
                    members['itinerant-spec-ed'] = {};
                }
                members['itinerant-spec-ed'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "itinerant-spec-ed@wrdsb.ca"
                };
            }
            if (its_job_codes.includes(job_code)) {
                if (!members['its-staff']) {
                    members['its-staff'] = {};
                }
                members['its-staff'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       'its-staff@wrdsb.ca'
                };
            }
            if (lars_communication_job_codes.includes(job_code)) {
                if (!members['lars-communication']) {
                    members['lars-communication'] = {};
                }
                members['lars-communication'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "lars-communication@wrdsb.ca"
                };
            }
            if (procurement_qna_job_codes.includes(job_code)) {
                if (!members['procurement-qna']) {
                    members['procurement-qna'] = {};
                }
                members['procurement-qna'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "procurement-qna@wrdsb.ca"
                };
            }
            if (psychologists_job_codes.includes(job_code)) {
                if (!members['psychologists']) {
                    members['psychologists'] = {};
                }
                members['psychologists'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "psychologists@wrdsb.ca"
                };
            }
            if (school_day_job_codes.includes(job_code)) {
                if (!members['school-day']) {
                    members['school-day'] = {};
                }
                members['school-day'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "school-day@wrdsb.ca"
                };
            }
            if (secondary_serts_job_codes.includes(job_code) && panel == 'S') {
                if (!members['secondary-serts']) {
                    members['secondary-serts'] = {};
                }
                members['secondary-serts'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "secondary-serts@wrdsb.ca"
                };
            }
            if (smaca_elementary_group_codes.includes(group_code) && panel == 'E') {
                if (!members['smaca-elementary-qna']) {
                    members['smaca-elementary-qna'] = {};
                }
                members['smaca-elementary-qna'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       'smaca-elementary-qna@wrdsb.ca'
                };
            }
            if (smaca_secondary_group_codes.includes(group_code) && panel == 'S') {
                if (!members['smaca-secondary-qna']) {
                    members['smaca-secondary-qna'] = {};
                }
                members['smaca-secondary-qna'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       'smaca-secondary-qna@wrdsb.ca'
                }
            }
            if (social_workers_job_codes.includes(job_code)) {
                if (!members['social-workers']) {
                    members['social-workers'] = {};
                }
                members['social-workers'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "social-workers@wrdsb.ca"
                };
            }
            if (special_education_location_codes.includes(location_code)) {
                if (!members['special-education']) {
                    members['special-education'] = {};
                }
                members['special-education'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "special-education@wrdsb.ca"
                };
            }
            if (special_education_consultants_job_codes.includes(job_code)) {
                if (!members['special-education-consultants']) {
                    members['special-education-consultants'] = {};
                }
                members['special-education-consultants'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "special-education-consultants@wrdsb.ca"
                };
            }
            if (speech_language_job_codes.includes(job_code)) {
                if (!members['speech-language']) {
                    members['speech-language'] = {};
                }
                members['speech-language'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "speech-language@wrdsb.ca"
                };
            }
            if (system_leaders_job_codes.includes(job_code)) {
                if (!members['system-leaders']) {
                    members['system-leaders'] = {};
                }
                members['system-leaders'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       'system-leaders@wrdsb.ca'
                };
            }
            if (thr_message_board_group_codes.includes(group_code)) {
                if (!members['thr-message-board']) {
                    members['thr-message-board'] = {};
                }
                members['thr-message-board'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "thr-message-board@wrdsb.ca"
                };
            }
            if (trillium_job_codes.includes(job_code)) {
                if (!members['trillium']) {
                    members['trillium'] = {};
                }
                members['trillium'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "trillium@wrdsb.ca"
                };
            }
            if (twea_job_codes.includes(job_code)) {
                if (!members['twea']) {
                    members['twea'] = {};
                }
                members['twea'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "twea@wrdsb.ca"
                };
            }
            if (wrdsb_managers_job_codes.includes(job_code)) {
                if (!members['wrdsb-managers']) {
                    members['wrdsb-managers'] = {};
                }
                members['wrdsb-managers'][email] = {
                    email:          email,
                    role:           "MEMBER",
                    status:         "ACTIVE",
                    type:           "USER",
                    groupKey:       "wrdsb-managers@wrdsb.ca"
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
