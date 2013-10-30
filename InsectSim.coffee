# ◆今後追加したい機能

#・jQueryUIでデザインする
#・スマホ版のページをjQueryMobileで作成


exports = @

$ ->
	# メイン
	insectBuildDirector = new InsectBuildDirector(new InsectBuilder())
	insect = insectBuildDirector.construct()
	
	if location.search.length >= 2
		insect.setSerial(location.search.substring(1))

	$("#foodList input:button").click ->
		foodFactory = new FoodFactory()
		food = foodFactory.create($(this).val())
		insect.eat(food)
	
	$("#levelUpButtons input:button").click ->
		insect.levelUp $(this).data("nextInsectType")

	$("#btnUndo").click ->
		insect.undo()

	$("#btnReset").click ->
		if confirm("リセットします。よろしいですか？") == false then return
		insect.reset()

	# ブラウザ保存
	browserSaveData = new BrowserSaveData("result", 8)
	browserSaveData.addListener new BrowserSaveDataViewer("cmbResultList")

	$("#btnResultSave").click ->
		index = $("#cmbResultList").val()

		name = prompt("保存名：")
		if not name? then return
		
		browserSaveData.setSaveData index, name, insect.getSerial()

	$("#btnResultLoad").click ->
		index = $("#cmbResultList").val()
		insect.setSerial browserSaveData.getSaveData(index)


	# ダイアログ
	initDialogBuildDirector = new InitDialogBuildDirector(new InitDialogBuilder())
	initDialog = initDialogBuildDirector.construct()

	$("#btnInitDialogShow").click ->
		initDialog.show();

	$("#btnInitDialogOk").click ->
		initDialog.close()

		insectType = $("#cmbInsectType").data("insectType")

		growthPointList = []
		jGrowthPointTextboxs = $("div.dialogBody div.TextArea input:text")
		for growthPointTextbox in jGrowthPointTextboxs
			growthPointList.push new Attribute(growthPointTextbox.attribute, growthPointTextbox.value)

		insect.inputInit(insectType, growthPointList);

	$("#btnInitDialogCancel").click ->
		initDialog.close()
