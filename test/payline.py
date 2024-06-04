class Paylines:
    def __init__(self, line, pay, free_spins, wild):
        self.wild = wild
        self.use_wild_in_first_position = False
        self.use_wild = None
        self.symbols_dict = {}
        self.line = line
        self.pay = pay
        self.free_spins = free_spins


def get_wild_lines():
    res = []

    wPos