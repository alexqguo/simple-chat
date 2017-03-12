(function() {
    var chat;
    var socket = io();
    var Elements = {
        LOGIN_FORM: 'login-form',
        FORM_WRAPPER: 'form-wrapper',
        CHAT_FORM: 'chat-form'
    };
    var Messages = {
        USER_LOGIN: 'login',
        USER_READY: 'ready',
        USER_MESSAGE: 'message',
        RELEASE_MESSAGE: 'release',
        NEW_USER: 'new_user'
    };

    function initSession() {
        var form = window.f = new LoginForm(Elements.LOGIN_FORM, Elements.FORM_WRAPPER);
    }

    socket.on('connect', initSession);

    function Chat(name, id) {
        this.id = id;
        this.name = name;
        this.form = document.getElementById(id);
        this.init();
    }

    Chat.prototype.init = function() {
        socket.emit(Messages.USER_LOGIN, { name: this.name }, function(data) {
            console.log(data);
        });

        socket.on(Messages.NEW_USER, this.acceptNewUser);
    }

    Chat.prototype.acceptNewUser = function(data) {
        console.log('new user ' + data.username);
    }

    function LoginForm(id, wrapper) {
        this.id = id;
        this.form = document.getElementById(id);
        this.wrapper = document.getElementById(wrapper);
        this.submitAction = null;

        this.init();
    }

    LoginForm.prototype.init = function() {
        var _this = this;

        this.form.addEventListener('submit', this.handleSubmit.bind(_this));
        this.form.querySelectorAll('button').forEach(function(button) {
            button.addEventListener('click', _this.handleSubmitClick.bind(_this));
        });
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

        if (this.submitAction === 'submit' && !!formData.username) {
            chat = new Chat(formData.username, Elements.CHAT_FORM);
        }

        this.close();
    }

    LoginForm.prototype.handleSubmitClick = function(e) {
        this.submitAction = e.target.getAttribute('data-action');
    }

    LoginForm.prototype.close = function() {
        this.wrapper.style.display = 'none';
        this.form.removeEventListener('submit', this.handleSubmit);
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
    */
}());
