(function() {
    var chat;
    var socket = io();
    var Elements = {
        LOGIN_FORM: 'login-form',
        FORM_WRAPPER: 'form-wrapper',
        CHAT_FORM: 'chat-form',
        CHAT_MESSAGES: 'chat-messages',
        ACTIVE_USERS: 'active-users'
    };
    var Messages = {
        USER_LOGIN: 'login',
        USER_READY: 'ready',
        USER_MESSAGE: 'message',
        RELEASE_MESSAGE: 'release',
        ALL_USERS: 'users_update',
        GET_USERS: 'get_users'
    };

    function initSession() {
        var form = window.f = new LoginForm(Elements.LOGIN_FORM, Elements.FORM_WRAPPER);
    }

    socket.on('connect', initSession);

    function Chat(name, id, messages) {
        this.id = id;
        this.name = name;
        this.form = document.getElementById(id);
        this.overlay = this.form.querySelector('.overlay');
        this.otherInput = this.form.querySelector('.form-other');
        this.messages = document.getElementById(messages);
        this.init();
    }

    Chat.prototype.init = function() {
        socket.on(Messages.RELEASE_MESSAGE, this.updateChatWithMessages.bind(this));

        if (this.name) {
            socket.emit(Messages.USER_LOGIN, { name: this.name }, function(data) {
                if (!data) {
                    document.location.reload(); // literally cannot happen... YET
                }
            });

            this.form.classList.add('active');
            this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
            this.otherInput.addEventListener('input', this.handleInputChange.bind(this));
        }
    }

    Chat.prototype.handleFormSubmit = function(e) {
        e.preventDefault();

        this.overlay.style.display = 'block';
        socket.emit(Messages.USER_READY, { message: this.serialize() });
    }

    Chat.prototype.handleInputChange = function(e) {
        if (e.target.value) {
            this.form.querySelector('.form-other-radio').checked = true;
        }
    }

    Chat.prototype.serialize = function() {
        var selected = this.form.querySelector('input[type="radio"]:checked');

        if (!selected) return null;

        var value = selected.value;

        if (isNaN(parseInt(value))) {
            value = this.otherInput.value;
        }

        return value;
    }

    Chat.prototype.clearInput = function() {
        this.otherInput.value = '';

        var radios = this.form.querySelectorAll('input[type="radio"]');

        for (var i = 0; i < radios.length; i++) {
            radios[i].checked = false;
        }
    }

    Chat.prototype.updateChatWithMessages = function(users) {
        var fragment = document.createDocumentFragment();

        for (var key in users) {
            var message = document.createElement('li');
            message.innerHTML = users[key].username + ': ' + users[key].message
            fragment.appendChild(message);
        }

        this.overlay.style.display = 'none';
        this.messages.appendChild(fragment);
        this.clearInput();
    }

    function LoginForm(id, wrapper) {
        this.id = id;
        this.form = document.getElementById(id);
        this.wrapper = document.getElementById(wrapper);
        this.submitAction = null; // this isn't currently needed

        this.init();
    }

    LoginForm.prototype.init = function() {
        var _this = this;
        var buttons = this.form.querySelectorAll('button');

        this.form.addEventListener('submit', this.handleSubmit.bind(_this));
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', this.handleSubmitClick.bind(this));
        }
    }

    LoginForm.prototype.serialize = function() {
        var data = {};
        var inputs = this.form.querySelectorAll('input');

        for (var i = 0; i < inputs.length; i++) {
            data[inputs[i].name] = inputs[i].value;
        }

        return data;
    }

    LoginForm.prototype.handleSubmit = function(e) {
        e.preventDefault();
        var formData = this.serialize();
        var username = !!formData ? formData.username : '';

        /*
        Used to check this.submitAction before creating a chat,
        but realized we want a new chat either way
        */
        chat = new Chat(
            username,
            Elements.CHAT_FORM,
            Elements.CHAT_MESSAGES
        );

        // TODO: remove
        window.c = chat;

        new ActiveUsers(Elements.ACTIVE_USERS);
        this.close();
    }

    LoginForm.prototype.handleSubmitClick = function(e) {
        this.submitAction = e.target.getAttribute('data-action');
    }

    LoginForm.prototype.close = function() {
        this.wrapper.style.display = 'none';
        this.form.removeEventListener('submit', this.handleSubmit);
    }

    function ActiveUsers(id) {
        this.id = id;
        this.box = document.getElementById(id);
        this.users = [];
        this.init();
    }

    ActiveUsers.prototype.init = function() {
        socket.on(Messages.ALL_USERS, this.updateUsers.bind(this));
        this.box.style.display = 'block';

        this.getInitialUsers();
    }

    ActiveUsers.prototype.getInitialUsers = function() {
        socket.emit('get_users');
    }

    ActiveUsers.prototype.updateUsers = function(data) {
        if (data) this.users = Object.keys(data);

        var content = this.users.length > 0 ? this.users.join(', ') : 'none';

        this.box.querySelector('.users-list').innerHTML = content;
    }

    /*
        client:
            - USER_LOGIN (send)
                when user is online
                { name: val }
            - USER_READY (send)
                when selection is made
                { selection: true }
            - RELEASE_MESSAGE (receive)
                when server says everyone is ready
                { release: true }
            - NEW_USER (receive)
                when a new user has logged in, take their name and add to members
                { username: val }
            - USER_MESSAGE (send)
                when release message is received, send message to server
                { message: val }
        server:
            - RELEASE_MESSAGE (send)
            - NEW_USER (send)

        message inheritance

        update everything if a user leaves. otherwise you'll get stuck
    */
}());
