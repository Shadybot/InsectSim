$(document).on('click', 'input:button', function(){
	/* Find the highest element value. */
	var TopElem = Math.max(insect.attributeStatusList.F.status,insect.attributeStatusList.W.status,insect.attributeStatusList.T.status,insect.attributeStatusList.I.status,insect.attributeStatusList.D.status)

	/* find the relevant skill modifier */
	var KinSkill = {
		"(ATK)": 1.06, 
		"(ATK/Rec)": 1.12, 
		"(ATK+)": 1.14, 
		"(ATK+SPD)": 1.14, 
		"(ATK+STA)": 1.14, 
		"(BAL)": 1.04, 
		"(BAL+)": 1.08, 
		"(BAL++)": 1.1, 
		"(STA)": 1, 
		"(STA+)": 1, 
		"(STA/Rec)": 1, 
		"(SPD)": 1, 
		"(SPD+)": 1, 
		"(STA+SPD)": 1, 
		"(SPD/Rec)": 1, 
		"(New)": 1
	}
	/* Regular Raw */ 
	$('#RegRaw').text(+(((insect.attributeStatusList.P.status - 15) / 9) * 10 * 0.45 * KinSkill[insect.insectTypeHolder.insectType.shortName]).toFixed(2))
	/* Regular Element*/
	$('#RegElem').text(TopElem * 2.5)
	/* Charged Raw */
	$('#ChargeRaw').text(+(((insect.attributeStatusList.P.status - 15) / 9) * 10 * 0.8 * KinSkill[insect.insectTypeHolder.insectType.shortName]).toFixed(2))
	/* Charged Element */
	$('#ChargeElem').text(TopElem * 2.5 * 1.5)
});
