import { getUser, getCards, updateUser, updateAvatar, addCard, removeCard, setLike, unsetLike } from './components/api.js';
import { createCardElement, updateLikeState, removeCardElement } from './components/card.js';
import { openPopup, closePopup, initPopupClose } from './components/modal.js';
import { enableValidation, clearValidation } from './components/validation.js';

const VALIDATION_CONFIG = {
  formSelector: '.popup__form',
  inputSelector: '.popup__input',
  submitButtonSelector: '.popup__button',
  inactiveButtonClass: 'popup__button_disabled',
  inputErrorClass: 'popup__input_type_error',
  errorClass: 'popup__error_visible',
};

const cardsList = document.querySelector('.places__list');

const profilePopup = document.querySelector('.popup_type_edit');
const profileForm = profilePopup.querySelector('.popup__form');
const nameInput = profileForm.querySelector('.popup__input_type_name');
const aboutInput = profileForm.querySelector('.popup__input_type_description');
const profileSaveBtn = profilePopup.querySelector('.popup__button');

const cardPopup = document.querySelector('.popup_type_new-card');
const cardForm = cardPopup.querySelector('.popup__form');
const cardNameInput = cardForm.querySelector('.popup__input_type_card-name');
const cardLinkInput = cardForm.querySelector('.popup__input_type_url');
const cardSaveBtn = cardPopup.querySelector('.popup__button');

const imagePopup = document.querySelector('.popup_type_image');
const popupImg = imagePopup.querySelector('.popup__image');
const popupCaption = imagePopup.querySelector('.popup__caption');

const avatarPopup = document.querySelector('.popup_type_edit-avatar');
const avatarForm = avatarPopup.querySelector('.popup__form');
const avatarInput = avatarForm.querySelector('.popup__input');
const avatarSaveBtn = avatarPopup.querySelector('.popup__button');

const statsPopup = document.querySelector('.popup_type_stats');
const statsInfo = statsPopup.querySelector('.popup__info');
const statsCardsList = statsPopup.querySelector('.popup__list');

const profileTitle = document.querySelector('.profile__title');
const profileAbout = document.querySelector('.profile__description');
const profileAvatar = document.querySelector('.profile__image');
const logo = document.querySelector('.header__logo');

const toDate = (iso) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

const makeStatRow = (label, value) => {
  const el = document.getElementById('tpl-stat-row').content.querySelector('.popup__info-item').cloneNode(true);
  el.querySelector('.popup__info-term').textContent = label;
  el.querySelector('.popup__info-description').textContent = value;
  return el;
};

const makeCardBadge = (name) => {
  const el = document.getElementById('tpl-card-badge').content.querySelector('.popup__list-item').cloneNode(true);
  el.textContent = name;
  return el;
};

const handleImage = (name, link) => {
  popupImg.src = link;
  popupImg.alt = name;
  popupCaption.textContent = name;
  openPopup(imagePopup);
};

const handleDelete = (cardEl, cardId) => { 
  removeCard(cardId) 
    .then(() => { 
      removeCardElement(cardEl); 
    }) 
    .catch(console.error); 
};


const handleLike = (cardEl, data, likeBtn, likeCount, isLiked) => { 

  const action = isLiked ? unsetLike : setLike; 
  
  action(data._id) 
    .then((updatedCardData) => { 
      updateLikeState(likeBtn, likeCount, updatedCardData.likes);
      data.likes = updatedCardData.likes; 
    }) 
    .catch(console.error); 
};

const handleFooterClick = () => { 

  getCards() 
    .then((cards) => { 
      if (cards.length === 0) return; 
 
      statsInfo.innerHTML = ''; 
      statsCardsList.innerHTML = ''; 

      const uniqueUsers = new Set(cards.map(c => c.owner._id));
      const totalUsersCount = uniqueUsers.size;
      const mostLikedCard = cards.reduce((max, c) => (c.likes.length > max.likes.length ? c : max), cards[0]); 
      const maxLikesCount = mostLikedCard ? mostLikedCard.likes.length : 0;
      const championName = mostLikedCard && mostLikedCard.owner ? mostLikedCard.owner.name : 'Нет автора';
      const totalLikes = cards.reduce((sum, c) => sum + c.likes.length, 0); 
 
      statsInfo.append( 
        makeStatRow('Всего пользователей:', totalUsersCount), 
        makeStatRow('Всего лайков:', totalLikes), 
        makeStatRow('Максимально лайков от одного:', maxLikesCount), 
        makeStatRow('Чемпион лайков:', championName) 
      );
 
      const topCards = [...cards]
        .sort((a, b) => b.likes.length - a.likes.length) 
        .slice(0, 3); 

      topCards.forEach((card) => statsCardsList.append(makeCardBadge(card.name))); 
 
      openPopup(statsPopup); 
    }) 
    .catch(console.error); 
};

const renderCard = (data, userId, prepend = false) => {
  const el = createCardElement(data, userId, {
    onImage: handleImage,
    onLike: handleLike,
    onDelete: handleDelete,
  });
  cardsList[prepend ? 'prepend' : 'append'](el);
};

document.querySelector('.profile__edit-button').addEventListener('click', () => {
  nameInput.value = profileTitle.textContent;
  aboutInput.value = profileAbout.textContent;
  clearValidation(profileForm, VALIDATION_CONFIG);
  openPopup(profilePopup);
});

document.querySelector('.profile__add-button').addEventListener('click', () => {
  cardForm.reset();
  clearValidation(cardForm, VALIDATION_CONFIG);
  openPopup(cardPopup);
});

profileAvatar.addEventListener('click', () => {
  avatarForm.reset();
  clearValidation(avatarForm, VALIDATION_CONFIG);
  openPopup(avatarPopup);
});

logo.addEventListener('click', handleFooterClick);

profileForm.addEventListener('submit', (e) => {
  e.preventDefault();
  profileSaveBtn.textContent = 'Сохранение...';
  updateUser(nameInput.value, aboutInput.value)
    .then((user) => {
      profileTitle.textContent = user.name;
      profileAbout.textContent = user.about;
      closePopup(profilePopup);
    })
    .catch(console.error)
    .finally(() => { profileSaveBtn.textContent = 'Сохранить'; });
});

avatarForm.addEventListener('submit', (e) => {
  e.preventDefault();
  avatarSaveBtn.textContent = 'Сохранение...';
  updateAvatar(avatarInput.value)
    .then((user) => {
      profileAvatar.style.backgroundImage = `url(${user.avatar})`;
      closePopup(avatarPopup);
    })
    .catch(console.error)
    .finally(() => { avatarSaveBtn.textContent = 'Сохранить'; });
});

Promise.all([getUser(), getCards()])
  .then(([user, cards]) => {
    profileTitle.textContent = user.name;
    profileAbout.textContent = user.about;
    profileAvatar.style.backgroundImage = `url(${user.avatar})`;
    cards.forEach((card) => renderCard(card, user._id));
  })
  .catch(console.error);


cardForm.addEventListener('submit', (e) => {
  e.preventDefault();
  cardSaveBtn.textContent = 'Создание...';
  addCard(cardNameInput.value, cardLinkInput.value)
    .then((data) => {
      renderCard(data, data.owner._id, true);
      closePopup(cardPopup);
      cardForm.reset();
    })
    .catch(console.error)
    .finally(() => { cardSaveBtn.textContent = 'Создать'; });
});

document.querySelectorAll('.popup').forEach(initPopupClose);

enableValidation(VALIDATION_CONFIG);
