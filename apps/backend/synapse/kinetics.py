# Named constant mapping for kinetic parameters
# Simple static dictionary mapping. If scaling or dynamic decay modeling is needed, this can be moved to a database or config file.

KINETIC_PARAMS = {
    # Lifespan = W_initial / decay_rate
    # Score 2: Target ~3 days
    2: {"w_initial": 20.0,  "decay_rate": 6.666},
    # Score 3: Target ~21 days
    3: {"w_initial": 50.0,  "decay_rate": 2.381},
    # Score 4: Target ~90 days
    4: {"w_initial": 100.0, "decay_rate": 1.111},
}

# Score 5 constants: Layer 3 is programmed to never decay or prune infinite weights.
W_INITIAL_CORE = float("inf")
DECAY_RATE_CORE = 0.0

def get_kinetic_params(score: int) -> dict:
    """
    Returns the kinetic parameters (initial weight and decay rate) for a given valence score.
    """
    if score == 5:
        return {"w_initial": W_INITIAL_CORE, "decay_rate": DECAY_RATE_CORE}
    return KINETIC_PARAMS.get(score, {"w_initial": 20.0, "decay_rate": 10.0})
