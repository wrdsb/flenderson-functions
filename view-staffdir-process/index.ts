import { AzureFunction, Context } from "@azure/functions"

const viewStaffDirProcess: AzureFunction = async function (context: Context, triggerMessage: string): Promise<void> {
    const execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z

    const panamaBlob = context.bindings.panamaBlob;

    const rows = panamaBlob;

    let directoryObject = {};
    let directoryArray = [];

    rows.forEach(function(row) {
        // If we're missing an email address, bail
        if (!row.EMAIL_ADDRESS) {
            return;
        }

        // Create the directoryRecord object for the directory collections
        var directoryRecord = {
            id:             row.EMAIL_ADDRESS,
            email:          row.EMAIL_ADDRESS,
            first_name:     row.FIRST_NAME,
            last_name:      row.SURNAME,
            directory:      row.DIRECTORY,
            phone_no:       row.PHONE_NO,
            extension:      row.EXTENSION,
            mbxnumber:      row.MBXNUMBER,
            school_code:    row.SCHOOL_CODE,
            full_name:      row.FULL_NAME,
            job_desc:       row.JOB_DESC
        };

        // Grab what will become our object identifier
        let email = directoryRecord.email;

        // Upsert directoryRecord into directory collection object
        directoryObject[email] = directoryRecord;
    });

    // Add each record from directoryObject to directoryArray
    Object.getOwnPropertyNames(directoryObject).forEach(function (email) {
        directoryArray.push(directoryObject[email]);
    });

    // Write out Flenderson's local copy of Panama's raw data
    context.bindings.viewRaw = JSON.stringify(panamaBlob);

    // Write out arrays and objects to blobs
    context.bindings.directoryNowArray = JSON.stringify(directoryArray);
    context.bindings.directoryNowObject = JSON.stringify(directoryObject);

    let callbackMessage = {
        id: 'flenderson-functions-' + context.executionContext.functionName +'-'+ context.executionContext.invocationId,
        eventType: 'Flenderson.View.StaffDir.Process',
        eventTime: execution_timestamp,
        //subject: ,
        data: {
            event_type: 'function_invocation',
            app: 'wrdsb-flenderson',
            function_name: context.executionContext.functionName,
            invocation_id: context.executionContext.invocationId,
            data: {},
            timestamp: execution_timestamp
        },
        dataVersion: '1'
    };

    context.bindings.callbackMessage = JSON.stringify(callbackMessage.data);

    context.log(JSON.stringify(callbackMessage));
    context.done(null, callbackMessage);
};

export default viewStaffDirProcess;