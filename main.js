function updateHit() {
  var $hitInputs = $('#tohit-mod, input[name=tohit-reroll]');
  if ($('#tohit').val() == '0') {
    // Autohit enabled, disable everything else
    $hitInputs.prop('disabled', true);
  } else {
    $hitInputs.prop('disabled', false);
  }
}

function updateDamage() {
  var $fixed = $('#damage-fixed-amount');
  if ($('#damage-fixed').is(':checked')) {
    $fixed.prop('disabled', false);
  } else {
    $fixed.prop('disabled', true);
  }
}

$(function() {
  $('#tohit').change(updateHit);
  $('input[name=damage]').change(updateDamage);
});
