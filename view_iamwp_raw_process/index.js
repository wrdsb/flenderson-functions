module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z

    var rows = context.bindings.iamwpRaw;

    var peopleObject = {};
    var peopleArray = [];
    var jobsObject = {};
    var jobsArray = [];
    var groupsObject = {};
    var groupsArray = [];
    var locationsObject = {};
    var locationsArray = [];

    rows.forEach(function(row) {
        // If we're missing an EIN or Position ID, bail
        if (!row.EMPLOYEE_ID || !row.POSITION_ID) {
            return;
        }

        // Create the main part of a Person object
        var personRecord = {
            id:             row.EMPLOYEE_ID,
            ein:            row.EMPLOYEE_ID,
            username:       (row.USERNAME ? row.USERNAME.toLowerCase() : ''),
            name:           row.FIRST_NAME,
            sortable_name:  row.SURNAME,
            first_name:     row.FIRST_NAME,
            last_name:      row.SURNAME,
            email:          row.EMAIL_ADDRESS
        };

        // Create the Position object for this row
        var personPosition = {
            ipps_ein:                         row.EMPLOYEE_ID,
            ipps_position_id:                 row.POSITION_ID,
            ipps_activity_code:               row.ACTIVITY_CODE,
            ipps_employee_group_category:     row.EMP_GROUP_CATEGORY,
            ipps_employee_group_code:         row.EMP_GROUP_CODE,
            ipps_employee_group_description:  row.EMP_GROUP_DESC,
            ipps_extension:                   row.EXTENSION,
            ipps_job_code:                    row.JOB_CODE,
            ipps_job_description:             row.JOB_DESC,
            ipps_location_code:               row.LOCATION_CODE,
            ipps_location_description:        row.LOCATION_DESC,
            ipps_panel:                       row.PANEL,
            ipps_phone_no:                    row.PHONE_NO,
            ipps_school_code:                 row.SCHOOL_CODE,
            ipps_school_type:                 row.SCHOOL_TYPE,
            ipps_home_location_indicator:     row.HOME_LOC_IND,
            ipps_position_start_date:         row.POSITION_START_DATE,
            ipps_position_end_date:           row.POSITION_END_DATE
        };

        // Grab what will become our object identifiers
        var ein = personRecord.ein;
        var position_id = personPosition.ipps_position_id;

        // Upsert Person, and current Position, to people collection object
        if (peopleObject[ein]) {
            if (personPosition.ipps_home_location_indicator === 'Y') {peopleObject[ein].ipps_home_location = personPosition.ipps_location_code;}
            peopleObject[ein].positions[position_id] = personPosition;
        } else {
            if (personPosition.ipps_home_location_indicator === 'Y') {personRecord.ipps_home_location = personPosition.ipps_location_code;}
            personRecord.positions = {};
            personRecord.positions[position_id] = personPosition;
            peopleObject[ein] = personRecord;
        }

        // Add/overwrite jobs, groups, and locations from this row to their collection objects
        jobsObject[personPosition.ipps_job_code] = {
            job_code: personPosition.ipps_job_code,
            job_description: personPosition.ipps_job_description,
        };
        groupsObject[personPosition.ipps_employee_group_code] = {
            employee_group_category: personPosition.ipps_employee_group_category,
            employee_group_code: personPosition.ipps_employee_group_code,
            employee_group_description: personPosition.ipps_employee_group_description,
        };
        locationsObject[personPosition.ipps_location_code] = {
            location_code: personPosition.ipps_location_code,
            location_description: personPosition.ipps_location_description,
        };
    });

    // Add each person from peopleObject to peopleArray
    Object.getOwnPropertyNames(peopleObject).forEach(function (ein) {
        var person = peopleObject[ein];
        var positions_array = [];
        Object.getOwnPropertyNames(person.positions).forEach(function (position) {
            positions_array.push(person.positions[position]);
        });
        person.positions = positions_array;
        peopleArray.push(person);
    });

    // Step through other collection objects and assign objects to their arrays
    Object.getOwnPropertyNames(jobsObject).forEach(function (job) {
        jobsArray.push(jobsObject[job]);
    });    
    Object.getOwnPropertyNames(groupsObject).forEach(function (group) {
        groupsArray.push(groupsObject[group]);
    });
    Object.getOwnPropertyNames(locationsObject).forEach(function (location) {
        locationsArray.push(locationsObject[location]);
    });

    // Write out arrays and objects to blobs
    context.bindings.peopleNowArray = JSON.stringify(peopleArray);
    context.bindings.peopleNowObject = JSON.stringify(peopleObject);

    context.bindings.jobsNowArray = JSON.stringify(jobsArray);
    context.bindings.jobsNowObject = JSON.stringify(jobsObject);

    context.bindings.groupsNowArray = JSON.stringify(groupsArray);
    context.bindings.groupsNowObject = JSON.stringify(groupsObject);

    context.bindings.locationsNowArray = JSON.stringify(locationsArray);
    context.bindings.locationsNowObject = JSON.stringify(locationsObject);

    var event_type = "ca.wrdsb.flenderson.ipps_view_iamwp.process";
    var event = {
        eventID: `${event_type}-${context.executionContext.invocationId}`,
        eventType: event_type,
        source: "/ipps/view/iamwp/process",
        schemaURL: "ca.wrdsb.flenderson.ipps_view_iamwp.process.json",
        extensions: {
            app: 'wrdsb-flenderson',
            label: "flenderson processes ipps_view_iamwp",
            tags: [
                "flenderson",
                "ipps",
                "ipps_view",
                "ipps_view_iamwp",
                "process"
            ]
        },
        data: {
            function_name: context.executionContext.functionName,
            invocation_id: context.executionContext.invocationId,
            result: {
                blobs: [
                    {
                        path: "ipps/people-now-array.json",
                        connection: "wrdsbflenderson_STORAGE"
                    },
                    {
                        path: "ipps/people-now-object.json",
                        connection: "wrdsbflenderson_STORAGE"
                    },
                    {
                        path: "ipps/jobs-now-array.json",
                        connection: "wrdsbflenderson_STORAGE"
                    },
                    {
                        path: "ipps/jobs-now-object.json",
                        connection: "wrdsbflenderson_STORAGE"
                    },
                    {
                        path: "ipps/groups-now-array.json",
                        connection: "wrdsbflenderson_STORAGE"
                    },
                    {
                        path: "ipps/groups-now-object.json",
                        connection: "wrdsbflenderson_STORAGE"
                    },
                    {
                        path: "ipps/locations-now-array.json",
                        connection: "wrdsbflenderson_STORAGE"
                    },
                    {
                        path: "ipps/locations-now-object.json",
                        connection: "wrdsbflenderson_STORAGE"
                    }
                ]
            },
        },
        eventTime: execution_timestamp,
        eventTypeVersion: "0.1",
        cloudEventsVersion: "0.1",
        contentType: "application/json"
    };

    context.bindings.flynnGrid = event;
    context.res = {
        status: 200,
        body: event
    };
    context.done();
};
