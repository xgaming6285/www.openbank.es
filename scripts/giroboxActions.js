const showClient = window.localStorage.getItem('shouldShowClient');
const showProspect = window.localStorage.getItem('shouldShowProspect');

!showClient && window.localStorage.setItem('shouldShowClient', 'false');
!showProspect && window.localStorage.setItem('shouldShowProspect', 'true');

function giroboxActions() {
  const isCustomer = atob(window.localStorage.getItem('mbisCustomer'));
  const hasSegmentClient = window.location.href.split('?').includes('segment=client');
  const hasSegmentProspect = window.location.href.split('?').includes('segment=prospect');
  const intervalGirobox = setInterval(() => {
    const clients = document.querySelectorAll('.girobox-client-wrapper');
    const prospects = document.querySelectorAll('.girobox-prospect-wrapper');

    if (prospects.length) {
      if (
        clients.length &&
        (hasSegmentClient || (isCustomer.includes('true') && !hasSegmentProspect))
      ) {
        window.localStorage.setItem('shouldShowProspect', 'false');
        window.localStorage.setItem('shouldShowClient', 'true');
        clients.forEach(client => client.classList.remove('hide'));
        prospects.forEach(prospect => prospect.classList.add('hide'));
      } else {
        window.localStorage.setItem('shouldShowClient', 'false');
        window.localStorage.setItem('shouldShowProspect', 'true');
        prospects.forEach(prospect => prospect.classList.remove('hide'));
      }
      clearInterval(intervalGirobox);
    } else {
      clearInterval(intervalGirobox);
    }
  }, 100);
}

document.addEventListener('DOMContentLoaded', giroboxActions);
