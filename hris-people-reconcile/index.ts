import { AzureFunction, Context } from "@azure/functions"
import { CosmosClient } from "@azure/cosmos";
import { isEqual } from "lodash";
import { create } from "domain";

const hrisPeopleReconcile: AzureFunction = async function (context: Context, triggerMessage: string): Promise<void> {
    const invocationID = context.executionContext.invocationId;
    const functionName = context.executionContext.functionName;
    const invocationTime = new Date();
    const invocationTimestamp = invocationTime.toJSON();  // format: 2012-04-23T18:25:43.511Z

    const eventType = 'Flenderson.HRIS.People.Reconcile';
    const eventID = `flenderson-functions-${functionName}-${invocationID}`;
    const logID = `${invocationTime.getTime()}-${invocationID}`;

    const cosmosEndpoint = process.env['cosmosEndpoint'];
    const cosmosKey = process.env['cosmosKey'];
    const cosmosDatabase = process.env['cosmosDatabase'];
    const cosmosContainer = 'people';

    const cosmosClient = new CosmosClient({endpoint: cosmosEndpoint, auth: {masterKey: cosmosKey}});

    // give our bindings more human-readable names
    const records_now = context.bindings.recordsNow;

    // fetch current records from Cosmos
    const records_previous = await getCosmosItems(cosmosClient, cosmosDatabase, cosmosContainer).catch(err => {
        context.log(err);
    });

    // object to store our total diff as we build it
    let calculation = {
        records_previous: records_previous,
        records_now: records_now,
        differences: {
            created_records: [],
            updated_records: [],
            deleted_records: []
        }
    };

    calculation = await findCreatesAndUpdates(calculation);
    calculation = await findDeletes(calculation);

    let creates = await processCreates(calculation.differences.created_records);
    let updates = await processUpdates(calculation.differences.updated_records);
    let deletes = await processDeletes(calculation.differences.deleted_records);

    let differences = await processDifferences(calculation.differences);
    let totalDifferences = await calculateTotalDifferences(calculation);
    let logObject = await createLogObject(logID, invocationTimestamp, totalDifferences, calculation);

    let callbackMessage = await createCallback(eventID, eventType, invocationTimestamp, logID, totalDifferences);

    if (totalDifferences > 0) {
        context.bindings.queuePersonPersist = creates.concat(updates, deletes);
        context.bindings.queuePersonChangeProcess = differences;
    }

    context.bindings.logObject = JSON.stringify(logObject);
    context.bindings.callbackMessage = JSON.stringify(callbackMessage);
    context.log(JSON.stringify(differences));
    context.done(null, callbackMessage);

    async function findCreatesAndUpdates(calculation)
    {
        context.log('findCreatesAndUpdates');

        let records_previous = calculation.records_previous;
        let records_now = calculation.records_now;

        // loop through all records in records_now, looking for updates and creates
        Object.getOwnPropertyNames(records_now).forEach(function (record_id) {
            let new_record = records_now[record_id];      // get the full person record from records_now
            let old_record = records_previous[record_id]; // get the corresponding record in records_previous
    
            // if we found a corresponding record in records_previous, look for changes
            if (old_record) {
                // Compare old and new records using Lodash _.isEqual, which performs a deep comparison
                let records_equal = isEqual(old_record, new_record);
    
                // if record changed, record the change
                if (!records_equal) {
                    calculation.differences.updated_records.push({
                        previous: old_record,
                        now: new_record
                    });
                }
   
            // if we don't find a corresponding record in records_previous, they're new
            } else {
                calculation.differences.created_records.push(new_record);
            }
        });
        return calculation;
    }

    async function findDeletes(calculation)
    {
        context.log('findDeletes');

        let records_previous = calculation.records_previous;
        let records_now = calculation.records_now;

        // loop through all records in records_previous, looking for deletes
        Object.getOwnPropertyNames(records_previous).forEach(function (record_id) {
            let new_record = records_now[record_id];
    
            if (!new_record) {
                // the record was deleted
                calculation.differences.deleted_records.push(records_previous[record_id]);
            }
        });

        return calculation;
    }

    async function processCreates(created_records)
    {
        context.log('processCreates');

        // array for the results being returned
        let messages = [];

        created_records.forEach(function (record) {
            let message = {
                operation: 'replace',
                payload: record
            };
            messages.push(JSON.stringify(message));
        });

        return messages;
    }

    async function processUpdates(updated_records)
    {
        context.log('processUpdates');

        // array for the results being returned
        let messages = [];

        updated_records.forEach(function (record) {
            let message = {
                operation: 'replace',
                payload: record.now
            };
            messages.push(JSON.stringify(message));
        });

        return messages;
    }

    async function processDeletes(deleted_records)
    {
        context.log('processDeletes');

        // array for the results being returned
        let messages = [];

        deleted_records.forEach(function (record) {
            let message = {
                operation: 'delete',
                payload: record
            };
            messages.push(JSON.stringify(message));
        });

        return messages;
    }

    async function processDifferences(differences)
    {
        context.log('processDifferences');

        // array for the results being returned
        let messages = [];

        differences.created_records.forEach(function (record) {
            let message = {
                operation: 'create',
                payload: record
            };
            messages.push(JSON.stringify(message));
        });

        differences.updated_records.forEach(function (record) {
            let message = {
                operation: 'update',
                payload: record
            };
            messages.push(JSON.stringify(message));
        });

        differences.deleted_records.forEach(function (record) {
            let message = {
                operation: 'delete',
                payload: record
            };
            messages.push(JSON.stringify(message));
        });

        return messages;
    }

    async function calculateTotalDifferences (calculation)
    {
        let creates = calculation.differences.created_records.length;
        let updates = calculation.differences.updated_records.length;
        let deletes = calculation.differences.deleted_records.length;
        let totalDifferences = creates + updates + deletes;

        return totalDifferences;
    }

    async function createLogObject(logID, invocationTimestamp, totalDifferences, calculation)
    {
        let logObject = {
            id: logID,
            timestamp: invocationTimestamp,
            total_differences: totalDifferences,
            differences: {
                created_records: calculation.differences.created_records,
                updated_records: calculation.differences.updated_records,
                deleted_records: calculation.differences.deleted_records
            }
        };

        return logObject;
    }

    async function createCallback(eventID, eventType, invocationTimestamp, logID, totalDifferences)
    {
        let callbackMessage = {
            id: eventID,
            event_type: eventType,
            event_time: invocationTimestamp,
            object: logID,
            total_differences: totalDifferences,
        };

        return callbackMessage;
    }

    async function createEvent(logID, totalDifferences)
    {
        context.log('createEvent');

        let event = {
            id: 'flenderson-functions-' + context.executionContext.functionName +'-'+ context.executionContext.invocationId,
            eventType: 'Flenderson.HRIS.People.Differences.Calculate',
            eventTime: invocationTimestamp,
            data: {
                event_type: 'function_invocation',
                app: 'wrdsb-flenderson',
                function_name: context.executionContext.functionName,
                invocation_id: context.executionContext.invocationId,
                data: {
                    total_differences: totalDifferences,
                    object: logID
                },
                timestamp: invocationTimestamp
            },
            dataVersion: '1'
        };

        return event;
    }

    async function getCosmosItems(cosmosClient, cosmosDatabase, cosmosContainer)
    {
        context.log('getCosmosItems');

        let records_previous = {};

        const querySpec = {
            query: `SELECT * FROM c`
        }
        const queryOptions  = {
            maxItemCount: -1,
            enableCrossPartitionQuery: true
        }

        const queryIterator = await cosmosClient.database(cosmosDatabase).container(cosmosContainer).items.query(querySpec, queryOptions);
        
        while (queryIterator.hasMoreResults()) {
            const results = await queryIterator.executeNext();

            records_previous = await consolidateCosmosItems(results.result, records_previous);

            if (results === undefined) {
                // no more results
                break;
            }   
        }

        return records_previous;
    }

    async function consolidateCosmosItems(items: any[], consolidatedObject)
    {
        items.forEach(function(item) {
            if (!item.deleted) {
                // These fields are not present in the data from the HRIS
                // They are added by Flenderson when the person is created/updated/deleted
                delete item.created_at;
                delete item.updated_at;
                delete item.deleted_at;
                delete item.deleted;
                delete item._rid;
                delete item._self;
                delete item._etag;
                delete item._attachments;
                delete item._ts;

                consolidatedObject[item.id] = item;
            }
        });

        return consolidatedObject;
    }
};

export default hrisPeopleReconcile;
