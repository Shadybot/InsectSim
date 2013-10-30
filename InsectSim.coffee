# ◆今後追加したい機能

#・ブラウザ保存、読み込み
#[保存No01:無し▽] [保存][読込]
#・変更が発生した箇所にエフェクトを出してわかりやすく
#-----
#・jQueryUIでデザインする
#・スマホ版のページをjQueryMobileで作成

exports = @

$ ->
	# メイン
	insectBuildDirector = new InsectBuildDirector(new InsectBuilder())
	insect = insectBuildDirector.construct()
	
	if location.search.length >= 2
		insect.setHistory(location.search.substring(1))

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
