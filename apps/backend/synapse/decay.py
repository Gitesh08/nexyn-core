"""
Pure decay math for Layer 3. 
W_current = W_initial - (Lambda * elapsed_time)
"""

def calculate_current_weight(weight_initial: float, decay_rate: float, elapsed_days: float) -> float:
    """
    Calculate the decayed weight.
    elapsed_days is the time since last_accessed.
    Returns W_initial if decay_rate is 0.0 (core rules).
    Clamps elapsed_days to 0 to prevent negative elapsed time bugs.
    """
    if decay_rate == 0.0 or weight_initial == float("inf"):
        return weight_initial
    
    elapsed_days = max(0.0, elapsed_days)
    
    return weight_initial - (decay_rate * elapsed_days)
