
# Init
- init tile variations (with rotations)
- init "cells" with all possible options (all tile variations)

# Loop
- look at grid and find least-entropy cells (may be multiple)
    - if more than 1, pick random one, else use least-entropy
    - if all cells collapsed, we're *DONE*
- use picked cell (from above) and randomly pick from it's possible connections (all the valid tile variations) and collapse it!
    - if no connections to choose from, we've hit a *CONTRADICTION*
- with the previously collapsed picked Cell...
    - go through each direction (l/r/u/d)...
        - remove irrelevant options from those directions... I.E. options that cannot be used because of the initial collapse
        - and recursively propogate to the next tiles, and the next, and the next...
- repeat from top of # Loop
    





# Contradiction
in this case, either:
- implement backtracking
or
- start over from beginning 