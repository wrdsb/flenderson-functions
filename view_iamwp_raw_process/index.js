module.exports = function (context, data) {
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
        // Create the main part of a Person object
        var personRecord = {
            id:             row.ipps_ein,
            ein:            row.ipps_ein,
            username:       row.username.toLowerCase(),
            name:           row.first_name + ' ' + row.last_name,
            sortable_name:  row.last_name + ', ' + row.first_name,
            first_name:     row.first_name,
            last_name:      row.last_name,
            email:          row.email
        };

        // Create the Position object for this row
        var personPosition = {
            ipps_ein:                         row.ipps_ein,
            ipps_activity_code:               row.ipps_activity_code,
            ipps_employee_group_category:     row.ipps_employee_group_category,
            ipps_employee_group_code:         row.ipps_employee_group_code,
            ipps_employee_group_description:  row.ipps_employee_group_description,
            ipps_extension:                   row.ipps_extension,
            ipps_job_code:                    row.ipps_job_code,
            ipps_job_description:             row.ipps_job_description,
            ipps_location_code:               row.ipps_location_code,
            ipps_location_description:        row.ipps_location_description,
            ipps_panel:                       row.ipps_panel,
            ipps_phone_no:                    row.ipps_phone_no,
            ipps_school_code:                 row.ipps_school_code,
            ipps_school_type:                 row.ipps_school_type,
            ipps_home_location_indicator:     row.ipps_home_location_indicator,
            ipps_position_id:                 row.ipps_position_id,
            ipps_position_start_date:         row.ipps_position_start_date,
            ipps_position_end_date:           row.ipps_position_end_date
        };

        // Grab what will become our object identifiers
        var ein = row.ipps_ein;
        var position_id = row.ipps_position_id;

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
        jobsObject[row.ipps_job_code] = {
            job_code: row.ipps_job_code,
            job_description: row.ipps_job_description,
        };
        groupsObject[row.ipps_employee_group_code] = {
            employee_group_category: row.ipps_employee_group_category,
            employee_group_code: row.ipps_employee_group_code,
            employee_group_description: row.ipps_employee_group_description,
        };
        locationsObject[row.ipps_location_code] = {
            location_code: row.ipps_location_code,
            location_description: row.ipps_location_description,
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

    // Write out arrays to blobs
    context.bindings.peopleNow = JSON.stringify(peopleArray);
    context.bindings.jobsNow = JSON.stringify(jobsArray);
    context.bindings.groupsNow = JSON.stringify(groupsArray);
    context.bindings.locationsNow = JSON.stringify(locationsArray);

    context.done();
};
