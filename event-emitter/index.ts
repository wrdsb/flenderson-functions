import { AzureFunction, Context } from "@azure/functions"

const eventEmitter: AzureFunction = async function (context: Context, triggerMessage: string): Promise<void> {
    const execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z

    const triggerObject = triggerMessage;

    context.bindings.eventBlob = JSON.stringify(triggerObject);

    context.log(triggerObject);
    context.done(null, triggerObject);
};

export default eventEmitter;