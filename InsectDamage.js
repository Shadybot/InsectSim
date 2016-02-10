$(document).on('click', 'input:button', function(){
	/* Find the highest element value. */
	var TopElem = Math.max(insect.attributeStatusList.F.status,insect.attributeStatusList.W.status,insect.attributeStatusList.T.status,insect.attributeStatusList.I.status,insect.attributeStatusList.D.status)

	/* find the relevant skill modifier */
	var KinSkill
	var KinType = ["(ATK)", "(ATK/Rec)", "(ATK+)", "(ATK+SPD)", "(ATK+STA)", "(BAL)", "(BAL+)", "(BAL++)", "(STA)", "(STA+)", "(STA/Rec)", "(SPD)", "(SPD+)", "(STA+SPD)", "(SPD/Rec)", "(New)"]
	var KinTypeBonus = [1.06, 1.12, 1.14, 1.14, 1.14, 1.04, 1.08, 1.1, 1, 1, 1, 1, 1, 1, 1, 1]
	for (index = 0; index < KinType.length; index++) {
		If (insect.insectTypeHolder.insectType.shortName == KinType[index]) {
			KinSkill = KinTypeBonus[index];
		}
	}	
	console.log(KinSkill) 
	console.log(insect.insectTypeHolder.insectType.shortName)
	/* Regular Raw */ 
	$('#RegRaw').text(((insect.attributeStatusList.P.status - 15) / 9) * 10 * 0.45)
	/* Regular Element*/
	$('#RegElem').text(TopElem * 2.5)
	/* Charged Raw */
	$('#ChargeRaw').text(((insect.attributeStatusList.P.status - 15) / 9) * 10 * 0.8)
	/* Charged Element */
	$('#ChargeElem').text(TopElem * 2.5 * 1.5)
});
