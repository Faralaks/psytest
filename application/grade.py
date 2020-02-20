from psytest_tools import b64enc, b64dec, get_testees_by_grade, get_user_by_login, decrypt, stamp2str, get_grades_by_psy, vprint
from application import app, mongo_connect
from application import decorators as decors
from flask import session, render_template, url_for




@app.route('/grade/<name>/')
@app.route('/grade/<name>/<sort_by>')
@decors.check_admin_or_psy
def grade(name, sort_by='result'):
    dec_name = b64dec(name)

    if session['status'] == 'admin':
        counters = get_grades_by_psy(session['psy_login'])['grades'][name]
        testees = get_testees_by_grade(session['psy_login'], dec_name).sort(sort_by, 1)
        return render_template('grade.html', logged=True, login=session['login'], count=0, testees=testees, counters=counters, name=dec_name, status='admin',
                               back_url=url_for('psy_info', login=session['psy_login']), dec=decrypt, t2st=stamp2str, b64enc=b64enc, cur_url=url_for('grade', name=name), title=dec_name+' класс')


    counters = get_grades_by_psy(session['login'])['grades'][name]
    cur_count = get_user_by_login(session['login'])['count']
    testees = get_testees_by_grade(session['login'], dec_name).sort(sort_by, 1)

    return render_template('grade.html', logged=True, login=session['login'], count=cur_count, testees=testees, counters=counters, name=dec_name, status='psy',
                           back_url=url_for('psy'), dec=decrypt, t2st=stamp2str, b64enc=b64enc, cur_url=url_for('grade', name=name), title=dec_name+' класс')