(function() {
  var exports;

  exports = this;

  $(function() {
    var initDialog, initDialogBuildDirector, insect, insectBuildDirector;
    insectBuildDirector = new InsectBuildDirector(new InsectBuilder());
    insect = insectBuildDirector.construct();
    if (location.search.length >= 2) {
      insect.setHistory(location.search.substring(1));
    }
    $("#foodList input:button").click(function() {
      var food, foodFactory;
      foodFactory = new FoodFactory();
      food = foodFactory.create($(this).val());
      return insect.eat(food);
    });
    $("#levelUpButtons input:button").click(function() {
      return insect.levelUp($(this).data("nextInsectType"));
    });
    $("#btnUndo").click(function() {
      return insect.undo();
    });
    $("#btnReset").click(function() {
      if (confirm("リセットします。よろしいですか？") === false) {
        return;
      }
      return insect.reset();
    });
    initDialogBuildDirector = new InitDialogBuildDirector(new InitDialogBuilder());
    initDialog = initDialogBuildDirector.construct();
    $("#btnInitDialogShow").click(function() {
      return initDialog.show();
    });
    $("#btnInitDialogOk").click(function() {
      var growthPointList, growthPointTextbox, insectType, jGrowthPointTextboxs, _i, _len;
      initDialog.close();
      insectType = $("#cmbInsectType").data("insectType");
      growthPointList = [];
      jGrowthPointTextboxs = $("div.dialogBody div.TextArea input:text");
      for (_i = 0, _len = jGrowthPointTextboxs.length; _i < _len; _i++) {
        growthPointTextbox = jGrowthPointTextboxs[_i];
        growthPointList.push(new Attribute(growthPointTextbox.attribute, growthPointTextbox.value));
      }
      return insect.inputInit(insectType, growthPointList);
    });
    return $("#btnInitDialogCancel").click(function() {
      return initDialog.close();
    });
  });

}).call(this);
