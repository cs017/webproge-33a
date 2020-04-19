document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#all_posts').addEventListener('click', view_all_posts);
    document.querySelector('#following').addEventListener('click', view_following);
    
    // By default, load all posts, first page
    view_all_posts();

    // Ability to create post
    document.querySelector('#compose-post').onsubmit = function() {
        submit_post();
    };
})

function view_all_posts() {
    // Show all posts view and hide other views
    document.querySelector('#all-posts-view').style.display = 'block';
    document.querySelector('#following-view').style.display = 'none';
    document.querySelector('#profile-view').style.display = 'none';
    document.querySelector('#display-posts-view').style.display = 'block';

    display_posts('all', 1);
}

function view_following() {
    // Show following view and hide other views
    document.querySelector('#all-posts-view').style.display = 'none';
    document.querySelector('#following-view').style.display = 'block';
    document.querySelector('#profile-view').style.display = 'none';
    document.querySelector('#display-posts-view').style.display = 'block';

    // Clear out what was in display-posts-view before
    document.querySelector('#display-posts-view').innerHTML = "";
    display_posts('followed', 1);
}

function display_posts(postview, page_num) {
    // Clear out what was in display-posts-view before
    document.querySelector('#display-posts-view').innerHTML = '';

    fetch(`/posts/${postview}/${page_num}`)
    .then(response => response.json())
    .then(posts => {
        if (posts && posts.length) {
            // Display posts
            posts.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.dataset.id = post.id;
                const postPoster = document.createElement('p');
                fetch(`/users/${post.poster}`)
                .then(response => response.json())
                .then(user => {
                    postPoster.dataset.id = user.id;
                })
                const postBody = document.createElement('p');
                const postTimestamp = document.createElement('p');
                const likeIcon = document.createElement('span');
                const postLikes = document.createElement('span');

                // Making sure line breaks are displayed properly in the post body
                postBodyWithBreaks = post.body;
                postBodyWithBreaks = postBodyWithBreaks.replace(/(?:\r\n|\r|\n)/g, '</br>');

                postPoster.innerHTML = post.poster;
                postTimestamp.innerHTML = post.timestamp;
                postBody.innerHTML = postBodyWithBreaks;
                postLikes.innerHTML = post.likes.length;

                postPoster.style.cursor = 'pointer';
                postPoster.style.fontWeight = 'bold';
                likeIcon.style.cursor = 'pointer';

                postDiv.appendChild(postPoster);
                postDiv.appendChild(postTimestamp);
                postDiv.appendChild(postBody);

                // Updating the like icon display and edit post display based on current user
                fetch(`user/current`)
                .then(response => response.json())
                .then(current => {
                    // Include edit button if current user's post
                    if (post.poster == current.username) {
                        const editButton = document.createElement('button');
                        editButton.className = "edit_buttons";
                        editButton.innerHTML = "Edit"
                        postDiv.appendChild(editButton);
                        editButton.addEventListener('click',function() {
                            postBody.style.display = 'none';
                            editButton.style.display = 'none';
                            const editForm = document.createElement('form');
                            const editBody = document.createElement('textarea');
                            const cancelButton = document.createElement('button');
                            const saveButton = document.createElement('button');
                            editBody.innerHTML = post.body
                            cancelButton.innerHTML = "Cancel"
                            saveButton.innerHTML = "Save"
                            editBody.style.display = 'block';
                            editForm.appendChild(editBody);
                            editForm.appendChild(cancelButton);
                            editForm.appendChild(saveButton);
                            postDiv.appendChild(editForm);
                            cancelButton.addEventListener('click',function() {
                                postBody.style.display = 'block';
                                editButton.style.display = 'inline';
                                editForm.style.display = 'none';
                                event.preventDefault();
                            })
                            saveButton.addEventListener('click',function() {
                                newBody = editBody.value
                                edit_post(postDiv.dataset.id, newBody, postview, page_num);
                                postBody.style.display = 'block';
                                editButton.style.display = 'inline';
                                editForm.style.display = 'none';
                                event.preventDefault();
                            })
                        })
                    } 
                    // Display orange like button if liked by current user, gray if not
                    if (post.likes.includes(current.username)) {
                        // If user is in list of likes
                        likeIcon.innerHTML = `<img src="https://iconsplace.com/wp-content/uploads/_icons/ffa500/256/png/hearts-icon-11-256.png" alt="Heart icon" height="15" width="15"></img>`;
                    }  
                    else {
                        // If user is not in list of likes
                        likeIcon.innerHTML = `<img src="https://iconsplace.com/wp-content/uploads/_icons/bababa/256/png/hearts-icon-11-256.png" alt="Heart icon" height="15" width="15"></img>`;
                    }
                    postDiv.appendChild(likeIcon);
                    postDiv.appendChild(postLikes);   
                })
                // Add listener for clicking on a user to visit profile
                postPoster.addEventListener('click',function() {
                    view_profile(post.poster);
                });

                // Add listener for clicking on the like icon to like or unlike a post
                likeIcon.addEventListener('click',function(){
                    // Determine whether this should be an unlike or a like
                    fetch(`user/current`)
                    .then(response => response.json())
                    .then(current => {
                        if (post.likes.includes(current.username)) {
                        // If user is in list of likes already:
                            unlike_post(post, postview, page_num)
                        }
                        else {
                        // If user is not in list of likes already:
                            like_post(post, postview, page_num)
                        }
                    })
                });
                
                document.querySelector('#display-posts-view').append(postDiv);

                // See if there's a next_page, a previous_page, neither, or both
                fetch(`/posts/view/${postview}/${page_num}`)
                .then(response => response.json())
                .then(page => {
                    if (page.previous == true) {
                        document.querySelector('#previous-page').style.display = 'inline';
                        prev_page_num = page_num - 1
                        document.querySelector('#previous-page').onclick = function() {
                            display_posts(postview, prev_page_num);
                        }
                    }
                    else {
                        document.querySelector('#previous-page').style.display = 'none';
                    }
                    if (page.next == true) {
                        document.querySelector('#next-page').style.display = 'inline';
                        next_page_num = page_num + 1
                        document.querySelector('#next-page').onclick = function() {
                            display_posts(postview, next_page_num);
                        }
                    }
                    else {
                        document.querySelector('#next-page').style.display = 'none';
                    }
                })
            })
        }
        else {
            const noPostsError = document.createElement('p')
            noPostsError.innerHTML = `No posts to show.`
            document.querySelector('#display-posts-view').append(noPostsError);
            document.querySelector('#previous-page').style.display = 'none';
            document.querySelector('#next-page').style.display = 'none';
        }
    });
}

function view_profile(user) {
    // Clear out whichever posts were there before
    document.querySelector('#display-posts-view').innerHTML = "";

    document.querySelector('#all-posts-view').style.display = 'none';
    document.querySelector('#following-view').style.display = 'none';
    document.querySelector('#profile-view').style.display = 'block';
    document.querySelector('#display-posts-view').style.display = 'block';

    fetch(`/users/${user}`)
    .then(response => response.json())
    .then(thisprofileuser => {
        document.querySelector('#profile-header').innerHTML = `${thisprofileuser.username}`;
        num_followers = thisprofileuser.followers.length
        num_followed = thisprofileuser.users_followed.length
        document.querySelector('#this-profile-followed-by').innerHTML = `${thisprofileuser.username} has ${num_followers} followers.`;
        document.querySelector('#this-profile-follows').innerHTML = `${thisprofileuser.username} is following ${num_followed}.`;
        fetch(`user/current`)
        .then(response => response.json())
        .then(current => {
            if (current.username != thisprofileuser.username) {
                if (thisprofileuser.followers.includes(current.username)) {
                    document.querySelector('#follow-button').style.display = 'none';
                    document.querySelector('#unfollow-button').style.display = 'block';
                }
                else {
                    document.querySelector('#follow-button').style.display = 'block';
                    document.querySelector('#unfollow-button').style.display = 'none';
                }
            }
            else {
                document.querySelector('#follow-button').style.display = 'none';
                document.querySelector('#unfollow-button').style.display = 'none';
            }
        });
    })
    display_posts(user, 1);
    // Add functionality for Follow button
    document.querySelector('#follow-button').onclick = function() {
        // Set up CSRF token
        token = getCookie('csrftoken');
        fetch(`/users/${user}`, {
            headers: {
                'X-CSRFToken': token
            },
            method: 'PUT',
            body: JSON.stringify({
                follow: true
            })
        })
        .then(result => {
            console.log(result);
            view_profile(user);
        });
    }
    // Add functionality for Unfollow button
    document.querySelector('#unfollow-button').onclick = function() {
        // Set up CSRF token
        token = getCookie('csrftoken');
        fetch(`/users/${user}`, {
            headers: {
                'X-CSRFToken': token
            },
            method: 'PUT',
            body: JSON.stringify({
                follow: false
            })
        })
        .then(result => {
            console.log(result);
            view_profile(user);
        });
    }
}

function submit_post() {
    // Set up CSRF token
    token = getCookie('csrftoken');
    fetch('/posts', {
        headers: {
            'X-CSRFToken': token
        },
        method: 'POST',
        body: JSON.stringify({
            body: document.querySelector('#compose-body').value
        })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
    });
}

function edit_post(postid, newbody, postview, page_num) {
    // Set up CSRF token
    token = getCookie('csrftoken');
    fetch(`/posts/${postid}`, {
        headers: {
            'X-CSRFToken': token
        },
        method: 'PUT',
        body: JSON.stringify({
            edit: true,
            body: newbody
        })
    })
    .then(editedPost => {
        console.log(editedPost);
        display_posts(postview, page_num);
    });
}

function like_post(post, postview, page_num) {
    // Set up CSRF token
    token = getCookie('csrftoken');
    fetch(`/posts/${post.id}`, {
        headers: {
            'X-CSRFToken': token
        },
        method: 'PUT',
        body: JSON.stringify({
            like: true
        })
    })
    .then(display_posts(postview, page_num))
}

function unlike_post(post, postview, page_num) {
    // Set up CSRF token
    token = getCookie('csrftoken');
    fetch(`/posts/${post.id}`, {
        headers: {
            'X-CSRFToken': token
        },
        method: 'PUT',
        body: JSON.stringify({
            like: false
        })
    })
    .then(display_posts(postview, page_num))
}

// This function comes from Django documentation - https://docs.djangoproject.com/en/3.0/ref/csrf/
// Used to get CSRF token
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}