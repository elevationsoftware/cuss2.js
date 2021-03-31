/**
 * Common Use Self Service V2 API Definition
 * <h3>Definiton of the new CUSS2 API.</h3>This API definition idescribes IATA Common Use Self Service (IATA RP 1706c), a standard that allows multiple airlines to share physical kiosks or other hardware devices to offer self-services to their passengers. These services include, but are not limited to passenger check-in functionality and self-service baggage drop off. The standard also defines how airlines and other application suppliers can develop CUSS-compliant applications that are able to run on any device whose platform is CUSS-compliant.<br><br>The API definiton is accompanied by the CUSS Specification (CUSS-TS), describing in human readable form (textual and graphical) the concepts, requirements, interaction, workflows and behavior for both CUSS platforms and CUSS applications, and the CUSS Implementation Guide (CUSS-IG) describing best practices and giving examples on how to implement CUSS compliant platforms- and applications.<br><br>The API requires and includes further schema definitions/domains as<br><br>- CUSS2 Basic Schemas<br>- CUSS2 Self Bag Drop<br>- CUSS2 Biometrics<br>- CUSS2 Payments<br>- CUSS2 Illumination<br><br>The IATA Common Use Group (CUG) and the CUSS Technical Solution Group (CUSS-TSG) maintain this API.
 *
 * OpenAPI spec version: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */

/**
 * The platform uses the CUSS 2 Application Activation Structure when activating a CUSS application.
 */
export interface ApplicationActivation { 
    /**
     * The application can use this value to change its look, feel, or behaviour.
     */
    applicationBrand?: string;
    /**
     * Indicates the mode of execution.
     */
    executionMode: ApplicationActivation.ExecutionModeEnum;
    /**
     * Indicates whether to operate in ACCESSIBLE mode or not.
     */
    accessibleMode: boolean;
    /**
     * Any additional options of execution in combination with the executionMode. (comma separated string)
     */
    executionOptions?: string;
    /**
     * As per RFC3066.- Please refer also to: http://www.lingoes.net/en/translator/langcode.htm
     */
    languageID: string;
    /**
     * Any data to be exchanged between callers and callees after a transfer call or self-activation.
     */
    transferData?: string;
}
export namespace ApplicationActivation {
    export type ExecutionModeEnum = 'MAM' | 'DSAM';
    export const ExecutionModeEnum = {
        MAM: 'MAM' as ExecutionModeEnum,
        DSAM: 'DSAM' as ExecutionModeEnum
    };
}