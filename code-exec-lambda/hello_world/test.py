
code = """
def maximum(numbers):
  pass

maximums()
"""

try:
    compile(code, 'code', 'exec')
except SyntaxError as e:
    print('SyntaxError: ' + str(e))
except ValueError as e:
    print('ValueError: ' + str(e))
except NameError as e:
    print('NameError: ' + str(e))