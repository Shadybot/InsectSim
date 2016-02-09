$(document).on('click', 'input:button', function(){
	/* Find the highest element value.
	/* find the relevant skill modifier
 SKILLS
ATK Up S: 1.06
ATK Up M: 1.12
ATK Up L: 1.14
All Up S: 1.04
All Up M: 1.08
All Up L: 1.10 */
	/* Regular Raw */ 
	$('#RegRaw').text(((insect.attributeStatusList.P.status - 15) / 9) * 10 * 0.45)
	/* Regular Element*/
	$('#RegElem').text(Math.max(insect.attributeStatusList.F.status,insect.attributeStatusList.W.status,insect.attributeStatusList.T.status,insect.attributeStatusList.I.status,insect.attributeStatusList.D.status) * 2.5)
	/* Charged Raw */
	$('#ChargeRaw').text(((insect.attributeStatusList.P.status - 15) / 9) * 10 * 0.8)
	/* Charged Element */
	$('#ChargeElem').text(Math.max(insect.attributeStatusList.F.status,insect.attributeStatusList.W.status,insect.attributeStatusList.T.status,insect.attributeStatusList.I.status,insect.attributeStatusList.D.status) * 2.5 * 1.5)
});
