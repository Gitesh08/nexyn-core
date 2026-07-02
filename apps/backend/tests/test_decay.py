from synapse.decay import calculate_current_weight

def test_decay_normal():
    w = calculate_current_weight(50.0, 3.5, 6.0)
    assert w == 29.0

def test_decay_zero_rate():
    w = calculate_current_weight(100.0, 0.0, 1000.0)
    assert w == 100.0

def test_decay_infinite_weight():
    w = calculate_current_weight(float('inf'), 0.0, 50.0)
    assert w == float('inf')

def test_decay_negative_elapsed():
    w = calculate_current_weight(50.0, 3.5, -5.0)
    assert w == 50.0

def test_decay_boundary():
    w = calculate_current_weight(20.0, 10.0, 2.0)
    assert w == 0.0
