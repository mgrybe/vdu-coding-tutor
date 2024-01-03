from pyflakes.api import check

def check(code, reporter):
    check(code, 'code', reporter)