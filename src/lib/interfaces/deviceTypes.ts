/**
 * Common Use Self Service V2 API Definition (current working version)
 * <h3>Definiton of the new CUSS2 API.</h3><p>This API definition describes IATA Common Use Self Service (IATA RP 1706c), a standard that allows multiple airlines or entities to share physical kiosks or other hardware devices to offer self-services to their passengers. These services include, but are not limited to passenger check-in functionality and self-service baggage drop off. The standard also defines how airlines and other application suppliers can develop CUSS-compliant applications that are able to run on any device whose platform is CUSS-compliant.<p>In its official release the API definiton is accompanied by the CUSS Specification (CUSS-TS), describing in human readable form (textual and graphical) the concepts, requirements, interaction, workflows and behavior for both CUSS platforms and CUSS applications, and the CUSS Implementation Guide (CUSS-IG) describing best practices and giving examples on how to implement CUSS compliant platforms- and applications.<p>The API requires and includes further schema definitions/domains as listed below<p>- CUSS2 Basic Schemas<br>- CUSS2 Self Bag Drop<br>- CUSS2 Biometrics<br>- CUSS2 Payments<br>- CUSS2 Illumination<p>The IATA Common Use Group (CUG) and the CUSS Technical Solution Group (CUSS-TSG) maintain this API. <p>For bug reports, design issues and/or any other feedback send your e-mail to:**<p><a href=\"mailto:6daf8354.iataonline.onmicrosoft.com@emea.teams.ms\">CUSS-TSG @ IATA</a></p>**-----------<p>&copy; International Air Transport Association (IATA) 2021. - All rights reserved.<p>THIS API DEFINITION AND ALL RELATED DOMAINS ARE PROVIDED ON AN \"AS IS\" AND \"AS AVAILABLE\" BASIS, WITHOUT WARRANTY OF ANY KIND.<p>TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IATA DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY AND WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, QUALITY, PERFORMANCE, ACCURACY, COMPLETENESS AND NON-INFRINGEMENT OF THIRD PARTY RIGHTS.<p>TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IATA SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO, DAMAGES FOR LOSS OF PROFITS, REVENUE, GOODWILL, BUSINESS INTERRUPTION, LOSS OF BUSINESS INFORMATION OR ANY OTHER PECUNIARY LOSS (EVEN IF LICENSOR HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES), HOWEVER CAUSED, AND REGARDLESS OF THE THEORY OF LIABILITY, ARISING OUT OF, OR RELATED TO, THIS LICENSE OR THE SPECIFICATIONS, INCLUDING THE USE OR PERFORMANCE OF THE SPECIFICATIONS AND OF ANY PRODUCTS OR SERVICES IMPLEMENTING, IN WHOLE OR IN PART, THE SPECIFICATIONS.<p>THE IATA PSC DATA EXCHANGE SPECIFICATIONS LICENSE TERMS APPLY TO ANY USE OF THIS API AND RELATED DOMAINS.<p>-----------
 *
 * OpenAPI spec version: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */

/**
 * Device Types describe how applications handle the device and how to advise users<p> NON_APPLICABLE_DEVICE_TYPE : Device doesn't fit in any category <br> PRINT : Device can print documents<br> READ : Device can read documents<br> MOTORIZED : Device can move in and out a document (e.g. cards)<br> DIP : User has to dip in and remove a document (e.g. cards or passports)<br> SWIPE : User has to the document or card<br> CONTACTLESS : Device can read a document from a (usually short) distance<br> INSERT : Documents have to be inserted into the device<br> DISPENSE : Devices can dispense a document to the user or another component<br> CAPTURE : Device can retract documents or cards<br> CONVEYOR : Device can move baggage back and forth<br> SCALE : Device can weigh items<br> CHIP_AND_PIN : Device is a Chip & PIN device / payment device<br> EXTERNAL : Device is not contained in the CUSS device<br> BIOMETRICS : Device is a biometrics device / interface <br> ASSISTIVE : Device can assist users with disabilities<br> ILLUMINATION : Device represents a light<br> DISPLAY : Device represents a display (e.g. a touch screen)
 */
export type DeviceTypes = 'PRINT' | 'READ' | 'MOTORIZED' | 'DIP' | 'SWIPE' | 'CONTACTLESS' | 'INSERT' | 'DISPENSE' | 'CAPTURE' | 'CONVEYOR' | 'SCALE' | 'CHIP_AND_PIN' | 'EXTERNAL' | 'BIOMETRICS' | 'ASSISTIVE' | 'ILLUMINATION' | 'DISPLAY';

export const DeviceTypes = {
    PRINT: 'PRINT' as DeviceTypes,
    READ: 'READ' as DeviceTypes,
    MOTORIZED: 'MOTORIZED' as DeviceTypes,
    DIP: 'DIP' as DeviceTypes,
    SWIPE: 'SWIPE' as DeviceTypes,
    CONTACTLESS: 'CONTACTLESS' as DeviceTypes,
    INSERT: 'INSERT' as DeviceTypes,
    DISPENSE: 'DISPENSE' as DeviceTypes,
    CAPTURE: 'CAPTURE' as DeviceTypes,
    CONVEYOR: 'CONVEYOR' as DeviceTypes,
    SCALE: 'SCALE' as DeviceTypes,
    CHIPANDPIN: 'CHIP_AND_PIN' as DeviceTypes,
    EXTERNAL: 'EXTERNAL' as DeviceTypes,
    BIOMETRICS: 'BIOMETRICS' as DeviceTypes,
    ASSISTIVE: 'ASSISTIVE' as DeviceTypes,
    ILLUMINATION: 'ILLUMINATION' as DeviceTypes,
    DISPLAY: 'DISPLAY' as DeviceTypes
};