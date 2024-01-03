class TestReport:
    def __init__(self):
        self.passed = []
        self.failed = []

    def addPassed(self, test):
        self.passed.append(test)

    def addFailed(self, test):
        self.failed.append(test)

    def hasPassed(self):
        return len(self.passed) > 0

    def hasFailed(self):
        return len(self.failed) > 0

# deprecated
def execute(report, test, description):
    try:
        test()
        report.addPassed(description)
    except AssertionError as e:
        report.addFailed(description)
    except Exception as e:
        report.addFailed(description)

def test(report, test, description):
    try:
        test()
        report.addPassed(description)
    except AssertionError as e:
        report.addFailed(description)
    except Exception as e:
        report.addFailed(description)