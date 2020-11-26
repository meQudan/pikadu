// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmZI6pPYDvpLX3_5Nm6kKiVhGbVOW02gw",
  authDomain: "pikadu-8d0bf.firebaseapp.com",
  databaseURL: "https://pikadu-8d0bf.firebaseio.com",
  projectId: "pikadu-8d0bf",
  storageBucket: "pikadu-8d0bf.appspot.com",
  messagingSenderId: "161248047559",
  appId: "1:161248047559:web:677dca9bee0ef14774a9e2"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Создаем переменную, в которую положим кнопку меню
let menuToggle = document.querySelector('#menu-toggle');
// Создаем переменную, в которую положим меню
let menu = document.querySelector('.sidebar');


const regExpValidEmail = /^\w+@\w+\.\w{2,}$/;

const loginElem = document.querySelector(".login");
const loginForm = document.querySelector(".login-form");
const emailInput = document.querySelector(".login-email");
const passwordInput = document.querySelector(".login-password");
const loginSignup = document.querySelector(".login-signup");
const userElem = document.querySelector(".user");
const userNameElem = document.querySelector(".user-name");
const exitElem = document.querySelector(".exit");
const editElem = document.querySelector(".edit");
const editContainet = document.querySelector(".edit-container");
const editUserName = document.querySelector(".edit-username");
const editPhotoURL = document.querySelector(".edit-photo");
const userAvatarElem = document.querySelector(".user-avatar");
const postsWrapper = document.querySelector(".posts");
const buttonNewPost = document.querySelector(".button-new-post");
const addPostElem = document.querySelector(".add-post");

const DEFAULT_PHOTO = userAvatarElem.src;

const setUsers = {
  user: null,

  allDisplayNames: [],

  initUser() {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.user = user;
      } else {
        this.user = null;
      }

      toggleAuthDom();
    })
  },

  logIn(email, password) {
    if (!regExpValidEmail.test(email)) return alert("email не валиден");

    firebase.auth().signInWithEmailAndPassword(email, password)
    .catch(err => {
      const errCode = err.code;
      const errMessage = err.messege;

      if (errCode === 'auth/wrong-password') {
        console.log(errMessage);
        alert('Неверный пароль');
      } else if(errCode == 'auth/user-not-found') {
        console.log(errMessage);
        alert('Пользователь не найден');
      } else {
        alert(errMessage);
      }
      console.log(err);
    });
  },

  logOut() {
    firebase.auth().signOut();
  },

  signUp(email, password) {
    if (!regExpValidEmail.test(email)) {
      alert("email не валиден");
      return; 
    };

    if (!email.trim() || !password.trim()) {
      alert("Введите даные");
      return;
    };

    firebase.auth()
      .createUserWithEmailAndPassword(email, password)
      .then(data => {
        let userName = email.substring(0, email.indexOf("@"));

        while (!this.uniqueDisplayName(userName)) {
          userName += '1';
        };

        this.updateDisplayName(userName).then(toggleAuthDom);   
      })
      .catch(err => {
        const errCode = err.code;
        const errMessage = err.messege;

        if (errCode === 'auth/weak-password') {
          console.log(errMessage);
          alert('Слабый пароль');
        } else if(errCode == 'auth/email-already-in-use') {
          console.log(errMessage);
          alert('Этот email уже используется');
        } else {
          alert(errMessage);
        }

        console.log(err);
      });

    posts.setPosts(showAllPosts);
  },
  
  editUser(userName, userPhoto) {
    const user = firebase.auth().currentUser;
    const oldDisplayName = user.displayName;
    const oldPhoto = user.photoURL;

    if (oldDisplayName === userName) {
      if (oldPhoto !== userPhoto) {
        user.updateProfile({photoURL: userPhoto}).then(toggleAuthDom);
      } else {
        return editContainet.classList.remove("visible");
      }
    } else if (this.uniqueDisplayName(userName) || oldDisplayName.toLowerCase() === userName.toLowerCase()) {
      this.updateDisplayName(userName).then(toggleAuthDom);

      if (oldPhoto !== userPhoto) {
        user.updateProfile({photoURL: userPhoto}).then(toggleAuthDom);
      }
    } else {
      return alert('Пользователь с таким именем уже существует');
    }

    posts.allPosts = posts.allPosts.map(post => {
      if (post.author.uid === user.uid) {
        post.author.displayName = userName;

        if (userPhoto) {
          post.author.photoURL = userPhoto;
        };
      };

      return post;
    });

    editContainet.classList.remove("visible");
    posts.setPosts(showAllPosts);
  },

  updateDisplayName(newDisplayName) {
    const user = firebase.auth().currentUser;
    const oldDisplayName = user.displayName;
    this.updateAllDisplayNames();

    if (oldDisplayName) {
      const oldDisplayNameIndex = this.allDisplayNames.findIndex(name => name === oldDisplayName);
      this.allDisplayNames.splice(oldDisplayNameIndex, 1);
    };

    this.allDisplayNames.push(newDisplayName);
    firebase.database().ref('displayNames').set(this.allDisplayNames);

    return user.updateProfile({displayName: newDisplayName});
  },

  uniqueDisplayName(displayName) {
    this.updateAllDisplayNames();

    return !this.allDisplayNames.find(name => name.toLowerCase() === displayName.toLowerCase());
  },

  updateAllDisplayNames() {
    firebase.database().ref('displayNames').on('value', snapshot => {
      this.allDisplayNames = snapshot.val() || [];
    });
  },

  sendForget(email) {
    firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      alert('Письмо отправлено');
    })
    .catch(err => {
      console.log(err);
      
    })
  }
};

const loginForget = document.querySelector('.login-forget');

loginForget.addEventListener('click', event => {
  event.preventDefault();
  setUsers.sendForget(emailInput.value);
  emailInput.value = '';
})

const posts = {
  allPosts: [  ],

  addPost(title, text, tags) {
    const user = firebase.auth().currentUser;

    this.allPosts.unshift({
      postID: `${(+new Date).toString(16)}-${user.uid}`,
      title,
      text,
      tags: tags.split(',').map(item => item.trim()),
      author: {
        displayName: setUsers.user.displayName,
        photoURL: setUsers.user.photoURL,
        uid: setUsers.user.uid
      },
      date: new Date().toLocaleString(),
      likes: 0,
      comments: 0,
    });

    this.setPosts();
  },

  setPosts() {
    // отправляем пост в бд
    firebase.database().ref('post').set(this.allPosts)
    .then(() => this.getPosts());
  },

  getPosts() {
    //отрисовка постов
    firebase.database().ref('post').on('value', snapshot => {
      this.allPosts = snapshot.val() || [];
      showAllPosts();
    })
  }
}

const toggleAuthDom = () => {
  const user = setUsers.user;
  console.log("user:", user);

  if (user) {
    loginElem.style.display = "none";
    userElem.style.display = "";
    userNameElem.textContent = user.displayName;
    userAvatarElem.src = user.photoURL || DEFAULT_PHOTO;
    buttonNewPost.classList.add("visible");
  } else {
    loginElem.style.display = "";
    userElem.style.display = "none";
    buttonNewPost.classList.remove("visible");
    addPostElem.classList.remove("visible");
    postsWrapper.classList.add("visible");
  }
  
};

const showAddPost = () => {
  addPostElem.classList.add("visible");
  postsWrapper.classList.remove("visible");
}

const showAllPosts = () => {
  let postsHTML = "";

  posts.allPosts.forEach(({title, text, tags, author, date, likes, comments} = post) => {
    let tagsHTML = "";
    
    tags.forEach((tag) => {
      tagsHTML += `<a href="#${tag}" class="tag">#${tag}</a>`
    });

    postsHTML += `
    <section class="post">
        <div class="post-body">
          <h2 class="post-title">${title}</h2>
          <p class="post-text">${text}</p>
          <div class="tags">
            ${tagsHTML}
          </div>
        </div>
        <div class="post-footer">
          <div class="post-buttons">
            <button class="post-button likes">
              <svg width="19" height="20" class="icon icon-like">
                <use xlink:href="img/icons.svg#like"></use>
              </svg>
              <span class="likes-counter">${likes}</span>
            </button>
            <button class="post-button comments">
              <svg width="21" height="21" class="icon icon-comment">
                <use xlink:href="img/icons.svg#comment"></use>
              </svg>
              <span class="comments-counter">${comments}</span>
            </button>
            <button class="post-button save">
              <svg width="19" height="19" class="icon icon-save">
                <use xlink:href="img/icons.svg#save"></use>
              </svg>
            </button>
            <button class="post-button share">
              <svg width="17" height="19" class="icon icon-share">
                <use xlink:href="img/icons.svg#share"></use>
              </svg>
            </button>
          </div>
          <!-- /.post-buttons -->
          <div class="post-author">
            <div class="author-about">
              <a href="#" class="author-username">${author.displayName}</a>
              <span class="post-time">${date}</span>
            </div>
            <a href="#" class="author-link"><img src="${author.photoURL || 'img/avatar.jpeg'}" alt="avatar" class="author-avatar"></a>
          </div>
          <!-- /.post-author -->
        </div>
        <!-- /.post-footer -->
      </section>
    `
  })

  postsWrapper.innerHTML = postsHTML;

  addPostElem.classList.remove("visible");
  postsWrapper.classList.add("visible");
};

const init = () => {
  // отслеживаем клик по кнопке меню и запускаем функцию 
  menuToggle.addEventListener('click', function (event) {
  // отменяем стандартное поведение ссылки
  event.preventDefault();
  // вешаем класс на меню, когда кликнули по кнопке меню 
  menu.classList.toggle('visible');
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
  
    const emailValue = emailInput.value;
    const passwordValue = passwordInput.value;
  
    setUsers.logIn(emailValue, passwordValue, toggleAuthDom);
    loginForm.reset();
  });
  
  loginSignup.addEventListener("click", (event) => {
    event.preventDefault();
    
    const emailValue = emailInput.value;
    const passwordValue = passwordInput.value;
  
    setUsers.signUp(emailValue, passwordValue);
    loginForm.reset();
  });
  
  exitElem.addEventListener("click", event => {
    event.preventDefault();
    editContainet.classList.remove("visible")
    setUsers.logOut();
  });
  
  editElem.addEventListener("click", event => {
    event.preventDefault();
    editUserName.value = setUsers.user.displayName;
    editPhotoURL.value = setUsers.user.photoURL || '';
    editContainet.classList.toggle("visible");
  });
  
  editContainet.addEventListener("submit", event => {
    event.preventDefault();
  
    setUsers.editUser(editUserName.value, editPhotoURL.value);
  });

  buttonNewPost.addEventListener('click', event => {
    event.preventDefault();
    showAddPost();
  });

  addPostElem.addEventListener('submit', event => {
    event.preventDefault();
    const {title, text, tags} = addPostElem.elements;
    
    if (title.value.length < 7) {
      alert('Слишком короткий заголовок');
      return;
    }

    if (text.value.length < 50) {
      alert('Слишком короткий пост');
      return;
    }

    posts.addPost(title.value, text.value, tags.value, showAllPosts);

    addPostElem.classList.remove('.visible');
    addPostElem.reset();
  });

  setUsers.initUser();
  posts.getPosts();
}

document.addEventListener("DOMContentLoaded", init);