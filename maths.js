function getprob(rollneeded, rollmod, rerollall, rerollones) {
  // Check for auto-success
  if (rollneeded == 0) {
    return 1;
  }

  var prob = (7 - rollneeded) / 6;
  var mod = rollmod / 6;
  var prob_neg = Math.max(prob + Math.min(mod, 0), 0);
  var prob_mod = Math.min(Math.max(prob + mod, 0), 5 / 6);

  var finalprob;
  if (rerollall) {
    finalprob = prob_neg + (1 - prob) * prob_mod;
  } else if (rerollones) {
    finalprob = Math.max(prob_mod, 1 / 6) + (1 / 6) * prob_mod;
  } else {
    finalprob = prob_mod;
  }
  return finalprob;
}

function gethitprob(tohit, tohit_mod, tohit_rerollall, tohit_rerollones) {
  return getprob(tohit, tohit_mod, tohit_rerollall, tohit_rerollones);
}

function getwoundprob(strength, toughness, towound_mod, towound_rerollall,
                      towound_rerollones) {
  var towound;
  if (strength >= 2 * toughness) {
    towound = 2;
  } else if (strength > toughness) {
    towound = 3;
  } else if (strength == toughness) {
    towound = 4;
  } else if (strength <= toughness / 2) {
    towound = 6;  // Out of order for predence over 5+
  } else if (strength < toughness) {
    towound = 5;
  }
  return getprob(towound, towound_mod, towound_rerollall, towound_rerollones);
}

function getsaveprob(armour, ap, invulnerable, invulnerable_rerollall,
                     invulnerable_rerollones) {
  var armourprob = getprob(armour, ap, false, false);
  var invulnerableprob = getprob(invulnerable, 0, invulnerable_rerollall,
                                 invulnerable_rerollones);
  return 1 - Math.max(armourprob, invulnerableprob);
}

function getspecialprob(special_4, special_5, special_5_ones, special_6) {
  var prob = 1;
  if (special_4) {
    prob *= 1 / 2;
  }
  if (special_5) {
    prob *= 2 / 3;
  }
  if (special_5_ones) {
    prob *= 11 / 18;;
  }
  if (special_6) {
    prob *= 5 / 6;
  }
  return prob;
}

function getInt(selector) {
  return parseInt($(selector).val(), 10);
}
function getBool(selector) {
  return $(selector).is(':checked');
}

function setDamage(damages, damage, probability) {
  if (damages[damage] === undefined) {
    damages[damage] = 0;
  }
  damages[damage] += probability;
}

var SIMLULATION_ITERS = 10000;
function simulate(numdamage, sides) {
  var sums = []
  for (i = 0; i < SIMLULATION_ITERS; i++) {
    total = 0;
    for (damage = 0; damage < numdamage; damage++) {
      total += Math.floor(Math.random() * sides) + 1
    }
    sums[total] = 1 + (sums[total] || 0);
  }

  for (i = 0; i < sums.length; i++) {
    sums[i] = sums[i] / SIMLULATION_ITERS || 0;
  }
  return sums;
}

function simulateBestOf2(numdamage, sides) {
  var sums = []
  for (i = 0; i < SIMLULATION_ITERS; i++) {
    total = 0;
    for (damage = 0; damage < numdamage; damage++) {
      roll1 = Math.floor(Math.random() * sides) + 1;
      roll2 = Math.floor(Math.random() * sides) + 1;
      total += Math.max(roll1, roll2);
    }
    sums[total] = 1 + (sums[total] || 0);
  }

  for (i = 0; i < sums.length; i++) {
    sums[i] = sums[i] / SIMLULATION_ITERS || 0;
  }
  return sums;
}

function getnumattacks(numattacks, attack_1, attack_d3, attack_d6) {
  if (attack_1) {
    return [{ prob: 1, numattacks: numattacks }];
  } else {
    var dist;
    if (attack_d3) {
      dist = simulate(numattacks, 3);
    } else if (attack_d6) {
      dist = simulate(numattacks, 6);
    }
    var out = [];
    for (var i = 0; i < dist.length; i++) {
      if (dist[i] > 0) {
        out.push({ prob: dist[i], numattacks: i })
      }
    }
    return out;
  }
}

function getdamagerolls(numattackrolls, damageprob) {
  var damagerolls = {};
  numattackrolls.forEach(function(d) {
    for (var i = 0; i <= d.numattacks; i++) {
      var probability = jStat.binomial.pdf(i, d.numattacks, damageprob);
      damagerolls[i] = d.prob * probability + (damagerolls[i] || 0)
    }
  })
  return damagerolls;
}

function getdamages(damagerolls, damage_fixed, damage_fixed_amount, damage_d3,
                    damage_d6, damage_2d6, damage_best2d6) {
  var damages = {}
  for (var damageroll in damagerolls) {
    var prob = damagerolls[damageroll]
    if (damage_fixed) {
      setDamage(damages, damageroll * damage_fixed_amount, prob);
    } else {
      var dist;
      if (damage_d3) {
        dist = simulate(damageroll, 3);
      } else if (damage_d6) {
        dist = simulate(damageroll, 6);
      } else if (damage_2d6) {
        dist = simulate(damageroll * 2, 6);
      } else if (damage_best2d6) {
        dist = simulateBestOf2(damageroll, 6)
      }
      for (var damage = 0; damage < dist.length; damage++) {
        setDamage(damages, damage, prob * dist[damage]);
      }
    }
  }
  return damages;
}

function getfinaldamage(damages, specialprob) {
  var maxDamage = Math.max.apply(null, Object.keys(damages));
  var finalDamage = {};
  for (damage = 0; damage <= maxDamage; damage++) {
    for (i = 0; i <= damage; i++) {
      var damageProb = damages[damage] || 0;
      if (damageProb > 0) {
        var probability = jStat.binomial.pdf(i, damage, specialprob);
        setDamage(finalDamage, i, damageProb * probability);
      }
    }
  }
  return finalDamage;
}

function getdata() {

  var numattacks = getInt('#num-attacks');
  var attack_1 = getBool("#attack-1");
  var attack_d3 = getBool("#attack-d3");
  var attack_d6 = getBool("#attack-d6");

  var tohit = getInt('#tohit');
  var tohit_mod = getInt('#tohit-mod');
  var tohit_rerollall = getBool('#tohit-reroll-all');
  var tohit_rerollones = getBool('#tohit-reroll-ones');

  var strength = getInt('#strength');
  var toughness = getInt('#toughness');
  var towound_mod = getInt('#towound-mod');
  var towound_rerollall = getBool('#towound-reroll-all');
  var towound_rerollones = getBool('#towound-reroll-ones');

  var armour = getInt('#armour');
  var ap = getInt('#ap');
  var invulnerable = getInt('#invulnerable');
  var invulnerable_rerollall = getBool('#invulnerable-reroll-all');
  var invulnerable_rerollones = getBool('#invulnerable-reroll-ones');

  var damage_fixed = getBool('#damage-fixed');
  var damage_fixed_amount = getInt('#damage-fixed-amount');
  var damage_d3 = getBool('#damage-d3');
  var damage_d6 = getBool('#damage-d6');
  var damage_2d6 = getBool('#damage-2d6');
  var damage_best2d6 = getBool('#damage-best2d6');

  var special_4 = getBool('#special-4');
  var special_5 = getBool('#special-5');
  var special_5_ones = getBool('#special-5-ones');
  var special_6 = getBool('#special-6');

  // Basic hit/wound/save probs
  var hitprob = gethitprob(tohit, tohit_mod, tohit_rerollall,
                           tohit_rerollones);
  var woundprob = getwoundprob(strength, toughness, towound_mod,
                               towound_rerollall, towound_rerollones);
  var saveprob = getsaveprob(armour, ap, invulnerable,
                             invulnerable_rerollall,
                             invulnerable_rerollones)

  // Probability of an attack hitting/wounding/failing save
  var damageprob = hitprob * woundprob * saveprob;
  // Probability of wound passing through special saves
  var specialprob = getspecialprob(special_4, special_5, special_5_ones,
                                   special_6);

  // Distribution of number of attacks
  var numattackrolls = getnumattacks(numattacks, attack_1, attack_d3, attack_d6)

  // Distribution of number of attacks that make it to damage rolls
  var damagerolls = getdamagerolls(numattackrolls, damageprob)

  // Distribution of number of wounds after multiplying out damage
  var alldamages = getdamages(damagerolls, damage_fixed, damage_fixed_amount,
                              damage_d3, damage_d6, damage_2d6, damage_best2d6)

  // Distribution of wounds after special saves
  var finalDamage = getfinaldamage(alldamages, specialprob);

  var data = [];
  var maxFinalDamage = Math.max.apply(null, Object.keys(finalDamage));

  var totalProb = 1;
  for (i = 0; i <= maxFinalDamage; i++) {
    var probability = finalDamage[i] || 0;
    data.push({
        probability: probability,
        total_probability: totalProb,
        count: i
    })
    totalProb -= probability;
  }

  return data;
}
