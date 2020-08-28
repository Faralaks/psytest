let psyList;
let lastKey;
let stats;
let curPsy;
let gradeList, gradeStats;
let preGeneratedPas;




function setToDefault() {
    jq("#psyFormLogin").val(curPsy.login);
    jq("#psyFormPas").val(curPsy.pas);
    jq("#psyFormIdent").val(curPsy.ident);
    jq("#psyFormCount").val(curPsy.count);
    jq("#psyFormCheckDel").prop("checked", curPsy.pre_del);
}

function saveCurPsy() {
    curPsy.login = jq("#psyFormLogin").val();
    curPsy.pas = jq("#psyFormPas").val();
    curPsy.ident = jq("#psyFormIdent").val();
    curPsy.count = jq("#psyFormCount").val();
    curPsy.pre_del = jq("#psyFormCheckDel").prop("checked");
}



function validateFormData(login, pas, ident, count) {
    //alert(+validateText(login) + validateText(ident) + validateNum(count))
    if (+validateText(login) + validatePas(pas) + validateText(ident) + validateNum(count) === 4) {
        jq("#psyFormBtnSave").prop("disabled", false);
    }
    else {
        jq("#psyFormBtnSave").prop("disabled", true);
    }

}


function validateText(elem){
    if(elem.val().match(/[^a-zA-Z0-9]/g) || !elem.val().length) {
        elem.toggleClass("is-invalid", true);
        jq(`#${elem.attr("id")}Msg`).text("Недопустимое значение");
        return false;
    }
    elem.toggleClass("is-invalid", false);
    return true;

}
function validatePas(elem){
    if(elem.val().match(/[^a-zA-Z0-9!"#$%&'()*,./:;=?@_`{|}~]/g) || elem.val().length < 8) {
        elem.toggleClass("is-invalid", true);
        jq(`#${elem.attr("id")}Msg`).text("Недопустимый пароль. Он должен содержать не меннее 8 символов");
        return false;
    }
    elem.toggleClass("is-invalid", false);
    return true;

}



function validateNum(elem){
    if(elem.val().length && +elem.val() > 0) {
        elem.toggleClass("is-invalid", false);
        return true;

    }
    elem.toggleClass("is-invalid", true);
    jq(`#${elem.attr("id")}Msg`).text("Неверное значение");
    return false;


}





function showStats(stats) {
    jq('#stat_psy_count').text(stats.psy_count);
    jq('#stat_whole').text(stats.whole);
    jq('#stat_not_yet').text(stats.not_yet);
    jq('#stat_clear').text(stats.clear);
    jq('#stat_danger').text(stats.danger);
    if (stats.msg)  {
        jq('#stat_msg').text(stats.msg);
        jq('#statsLinesMsg').addClass('d-flex').show()
    }
    else {
        jq('#statsLinesMsg').removeClass('d-flex').hide()
    }

}

function showPsy(key) {
    preGeneratedPas = jq("#psyFormPas").val();
    let psyTable = jq("#psyTable");
    jq('td').remove();

    if (key) {
        if (key===lastKey) { reverse *= -1; }
        else { reverse = 1; lastKey = key; }

        psyList.sort(function (a, b) {
        if (a[key] > b[key]) { return reverse; }
        if (a[key] < b[key]) { return -1*reverse; }
        return 0;
        });
    }




    for (let i = 0; i < psyList.length; i++) {
        let ownStats = `
            <span class="badge badge-light badge-pill" title="Количество испытуемых">${ psyList[i].counters.whole?psyList[i].counters.whole:0}</span>
            <span class="badge badge-secondary badge-pill" title="Еще не протестировано">${ psyList[i].counters.not_yet?psyList[i].counters.not_yet:0 }</span>
            <span class="badge badge-success badge-pill" title="Вне групп риска">${ psyList[i].counters.clear?psyList[i].counters.clear:0 }</span>
            <span class="badge badge-danger badge-pill" title="В группах риска">${ psyList[i].counters.danger?psyList[i].counters.danger:0 }</span>`;
        if (psyList[i].counters.msg) {
            ownStats += `<span class="badge badge-warning badge-pill" title="Сообщения об удалении">${psyList[i].counters.msg}</span>`
        }
        let trPsy = jq("<tr></tr>")
            .append(jq(`<td>${psyList[i].ident}</td>`))
            .append(jq(`<td>${psyList[i].login}</td>`))
            .append(jq(`<td>${psyList[i].pas}</td>`))
            .append(jq(`<td>${psyList[i].count}</td>`))
            .append(jq(`<td>${ownStats}</td>`))
            .append(jq(`<td>${psyList[i].tests}</td>`))
            .append(jq(`<td>${psyList[i].create_date.replace(' ', '<br>')}</td>`))
            .append(jq(`<td><input type="button" class="btn btn-primary" onclick="showPsyInfo(${i})" value="Подробнее"></td>`));
        if (psyList[i].pre_del) trPsy.append(jq(`<td><i class="fa fa-trash" aria-hidden="true" title="Будет удален менее чем через ${Math.ceil((psyList[i].pre_del - (Date.now() / 1000 | 0))/3600)} ч."></i></td>`));

        psyTable.append(trPsy);

    }

}


function getPsyList() {
    jq.ajaxSetup({timeout:10000});
    jq.post("/admin").done(function (psysAndStats) {
        psyList = psysAndStats.psys;
        stats = psysAndStats.stats;
        showPsy();
        showStats(stats)
    }).fail(function () { showMsg('Данные загрузить не удалось', "Err")

    });
}



function addNewPsy() {
    jq.ajaxSetup({timeout:3000});
    jq.post("/add_psy", jq("#addPsyForm").serialize()).done(function (response) {
        showMsg(response.msg, response.kind,function () { clearPsyForm(); getPsyList(); }, response.field);
    }).fail(function () {
        showMsg("Превышено время ожидания или произошла ошибка на стороне сервера! Операция не выполнена");
    })
}


function editPsy() {
    jq.ajaxSetup({timeout:3000});
    jq.post(`/edit_psy/${curPsy.login}`, jq("#addPsyForm").serialize()).done(function (response) {
        alert(response.kind);
        showMsg(response.msg, response.kind,function () { saveCurPsy() }, response.field);
    }).fail(function () {
        showMsg("Превышено время ожидания или произошла ошибка на стороне сервера! Операция не выполнена");
    })
}



function showGrades(key) {
    let gradeTable = jq("#gradeTable");
    jq('#gradeTable td').remove();

    if (key) {
        if (key===lastKey) { reverse *= -1; }
        else { reverse = 1; lastKey = key; }

        psyList.sort(function (a, b) {
        if (a[key] > b[key]) { return reverse; }
        if (a[key] < b[key]) { return -1*reverse; }
        return 0;
        });
    }




    for (let i = 0; i < gradeList.length; i++) {
        let trGrade = jq("<tr></tr>").append(jq(`<td>${atob(gradeList[i][0])}</td>`))
            .append(jq("<td></td>").append(jq(`<span class="badge badge-Light badge-pill">${gradeList[i][1].whole?gradeList[i][1].whole:0}</span>`)))
            .append(jq("<td></td>").append(jq(`<span class="badge badge-secondary badge-pill">${gradeList[i][1].not_yet?gradeList[i][1].not_yet:0}</span>`)))
            .append(jq("<td></td>").append(jq(`<span class="badge badge-success badge-pill">${gradeList[i][1].clear?gradeList[i][1].clear:0}</span>`)))
            .append(jq("<td></td>").append(jq(`<span class="badge badge-danger badge-pill">${gradeList[i][1].danger?gradeList[i][1].danger:0}</span>`)))
            .append(jq(`<td><input type="button" class="btn btn-primary" onclick="showsyInfo(${i})" value="Просптреть"></td>`))
        if (gradeList[i][1].msg) {
            trGrade.append(`<td><span class="btn btn-warning my-2 my-sm-0" title="В этом классе есть запросы на удаление результата">
                <i class="fa fa-exclamation-triangle" aria-hidden="true"></i>&nbsp;${gradeList[i][1].msg}</span></td>`);
        }
        gradeTable.append(trGrade);

    }
}



function getGradeList() {
    jq.ajaxSetup({timeout:10000});
    jq.post(`/get_grade_list/${curPsy.login}`).done(function (gradesAndStats) {
        gradeList = gradesAndStats.grades;
        gradeStats = gradesAndStats.stats;
        showStats(gradeStats);
        showGrades();
    }).fail(function () { showMsg('Данные загрузить не удалось', "Err")


    });
}




function clearPsyForm() {
    jq("#psyFormLogin").val("");
    jq("#psyFormPas").val(generatePas(12));
    jq("#psyFormIdent").val("");
    jq("#psyFormCount").val("");
}


function showPsyInfo(psyIdx) {
    curPsy = psyList[psyIdx];
    setToDefault();

    jq("#psyTablePlace").hide();
    jq("#statsLinesPsyCount").removeClass("d-flex").hide();

    jq("#gradeTablePlace").show();
    jq("#psyFormBtnDef").show();
    jq("#psyFormPlaceDel").show();
    jq("#barBtnBack").click(function () { showAdminMainPage() }).show();

    jq("#psyFormTitle").text("Редактировать Психолога");
    jq("#statsCardTitle").text(`${curPsy.login} | Статистика`);
    jq("#psyFormBtnSave").attr("onclick", "editPsy()").val("Сохранить");

    jq("input").toggleClass("is-invalid", false);
    jq("#psyFormBtnSave").prop("disabled", true);
    showStats(curPsy.counters);
    getGradeList();

}



function showAdminMainPage() {
    clearPsyForm();
    curPsy = undefined;

    jq("#psyTablePlace").show();
    jq("#statsLinesPsyCount").addClass("d-flex").show();

    jq("#gradeTablePlace").hide();
    jq("#psyFormBtnDef").hide();
    jq("#psyFormPlaceDel").hide();
    jq("#barBtnBack").hide();

    jq("#psyFormTitle").text("Добавить психолога");
    jq("#statsCardTitle").text(`Полная статистика`);
    jq("#psyFormBtnSave").attr("onclick", "addNewPsy()").val("Добавить психолога");
    jq("#psyFormPas").val(preGeneratedPas);

    jq("input").toggleClass("is-invalid", false);
    jq("#psyFormBtnSave").prop("disabled", true);
    showStats(stats);


}

jq("#psyFormPas").ready(function () { jq("#psyFormPas").val(generatePas(12)) });

jq("#psyTablePlace").ready(function () {
    getPsyList()

});

