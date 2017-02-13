/*
 * Shor's factoring algorithm.
 * See https://cs.uwaterloo.ca/~watrous/lecture-notes/519/11.pdf
 */

function computeOrder(a, n, numOutBits, callback) {
    var numInBits = 2 * numOutBits;
    var inputRange = Math.pow(2,numInBits);
    var outputRange = Math.pow(2,numOutBits);
    var accuracyRequiredForContinuedFraction = 1/(2 * outputRange * outputRange);
    var outBits = {from: 0, to: numOutBits - 1};
    var inputBits = {from: numOutBits, to: numOutBits + numInBits - 1};
    var attempts = 0;
    var bestSoFar = 1;
    var f = function(x) { return jsqubitsmath.powerMod(a, x, n); }
    var f0 = f(0);

    // This function contains the actual quantum computation part of the algorithm.
    // It returns either the frequency of the function f or some integer multiple (where 'frequency' is the number of times the period of f will fit into 2^numInputBits)
    function determineFrequency(f) {
        var qstate_init = new jsqubits.QState(numInBits + numOutBits);
        log('initial state: ' +  new jsqubits.QState(numInBits + numOutBits))
        //a hadamard gate is applied to all the bits of the first register.
        var qstate = qstate_init.hadamard(inputBits);
        //the state is expanded such that the input register now contains a^x mod N where a is the guessed number
        qstate = qstate.applyFunction(inputBits, outBits, f);
        // We do not need to measure the outBits, but it does speed up the simulation.
        qstate = qstate.measure(outBits).newState;

        return qstate.qft(inputBits).measure(inputBits).result;
    }

    // Determine the period of f (i.e. find r such that f(x) = f(x+r).
    function findPeriod() {

        // NOTE: Here we take advantage of the fact that, for Shor's algorithm, we know that f(x) = f(x+i) ONLY when i is an integer multiple of r.
        if (f(bestSoFar) === f0) {
            log('The period of ' + a + '^x mod ' + n + ' is ' + bestSoFar);
            callback(bestSoFar);
            return;
        }

        if (attempts === 2 * numOutBits) {
            log('Giving up trying to find rank of ' + a);
            callback('failed');
            return;
        }

        var sample = determineFrequency(f);

        // Each 'sample' has a high probability of being approximately equal to some integer multiple of (inputRange/r) rounded to the nearest integer.
        // So we use a continued fraction function to find r (or a divisor of r).
        var continuedFraction = jsqubitsmath.continuedFraction(sample/inputRange, accuracyRequiredForContinuedFraction);
        // The denominator is a 'candidate' for being r or a divisor of r (hence we need to find the least common multiple of several of these).
        var candidate = continuedFraction.denominator;
        log('Candidate period from quantum fourier transform: ' + candidate);
        // Reduce the chances of getting the wrong answer by ignoring obviously wrong results!
        if (candidate <= 1 || candidate > outputRange) {
            log('Ignoring as candidate is out of range.');
        } else if (f(candidate) === f0) {
            bestSoFar = candidate;
        } else {
            var lcm = jsqubitsmath.lcm(candidate, bestSoFar);
            log('Least common multiple of new candidate and best LCM so far: ' + lcm);
            if (lcm > outputRange) {
                log('Ignoring this candidate as the LCM is too large!')
		    } else {
                bestSoFar = lcm;
            }
        }
        attempts++;
        log('Least common multiple so far: ' + bestSoFar + '. Attempts: ' + attempts);
        // Yield control to give the browser a chance to log to the console.
        setTimeout(findPeriod, 50);
    }

    log('Step 2: compute the period of ' + a + '^x mod ' + n);
    findPeriod();
}

function factor(n, callback) {

    var attempt = 0;
    //this is equivalent to ceil(log_2(N)) which is the number of bits required to store number n that is being factored
    var numOutBits = Math.ceil(Math.log(n)/Math.log(2));

    function attemptFactor() {
        if (attempt++ === 8) {
            callback('failed');
            return;
        }
        var randomChoice = 2 + Math.floor(Math.random() * (n - 2));
        log('Step 1: chose random number between 2 and ' + n + '.  Chosen: '  + randomChoice);
        var gcd = jsqubitsmath.gcd(randomChoice, n);
        if(gcd > 1) {
            log('Lucky guess.  ' + n + ' and randomly chosen ' + randomChoice + ' have a common factor = ' + gcd);
            callback(gcd);
            return;
        }

        computeOrder(randomChoice, n, numOutBits, function(r) {
		if (r !== 'failed' && r % 2 !== 0) {
		    log('Need a period with an even number.  Sadly, ' + r + ' is not even.');
		} else if (r !== 'failed' && r % 2 === 0) {
		    var powerMod = jsqubitsmath.powerMod(randomChoice, r/2, n);
		    var candidateFactor = jsqubitsmath.gcd(powerMod - 1, n);
		    log('Candidate Factor computed from period = ' + candidateFactor);
		    if(candidateFactor > 1 && n % candidateFactor === 0) {
			callback(candidateFactor);
			return;
		    }
		    log(candidateFactor  + ' is not really a factor.');
		}
		log('Try again. (Attempts so far: ' + attempt + ')');
		// Yield control to give the browser a chance to log to the console.
		setTimeout(function(){attemptFactor();}, 30)
		    });
    }

    if (n % 2 === 0) {
        log('Is even.  No need for any quantum computing!')
	    callback(2);
        return;
    }

    var powerFactor = jsqubitsmath.powerFactor(n);
    if (powerFactor > 1) {
        log('Is a power factor.  No need for anything quantum!')
	    callback(powerFactor);
        return;
    }

    attemptFactor();
}

var n = 35;

var startTime = new Date();
factor(n, function(result) {
	log('One of the factors of ' + n + ' is ' + result);
	log('Time taken in seconds: ' + ((new Date().getTime()) - startTime.getTime()) / 1000);
    });