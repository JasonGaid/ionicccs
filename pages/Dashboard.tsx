import React, { useState, useEffect } from 'react';
  import { useHistory } from 'react-router-dom';
  import axios from 'axios';
  import { IonPopover, IonList, IonItem, IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonFooter, IonModal, IonInput, IonSelect, IonSelectOption, IonIcon, useIonToast } from '@ionic/react';
  import { logOutOutline, createOutline, trashOutline, pencilOutline, closeCircleOutline } from 'ionicons/icons';
  

  const Dashboard: React.FC = () => {
    const [isCreatingBlog, setIsCreatingBlog] = useState(false);
    const [present] = useIonToast();
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<any>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategoryData, setSelectedCategoryData] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [editingPost, setEditingPost] = useState<any>(null);
    const [popoverState, setShowPopover] = useState({ showPopover: false, event: undefined });
    const [commentContent, setCommentContent] = useState('');
    const history = useHistory();

    useEffect(() => {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        setUser(user);
        fetchCategories();
        fetchPosts();
      } else {
        history.push('/login');
      }
    }, [history]);

    async function fetchCategories() {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        present({
          message: 'Failed to fetch categories',
          duration: 3000,
          position: 'top',
        });
      }
    }

    async function fetchCategoryData(selectedCategory: string) {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/categories?name=${selectedCategory}`);
        setSelectedCategoryData(response.data);
      } catch (error) {
        console.error('Error fetching category data:', error);
        present({
          message: 'Failed to fetch category data',
          duration: 3000,
          position: 'top',
        });
      }
    }

    async function createBlog() {
    try {
      // Check for violations in title
      const titleViolated = checkForViolations(title);
      
      // Check for violations in content
      const contentViolated = checkForViolations(content);

      // Increment report count if violations found
      if (titleViolated || contentViolated) {
          await incrementReportCount(user.id);
      }

      if (!category) {
        present({
          message: 'Please select a category',
          duration: 3000,
          position: 'top',
        });
        return;
      }
      setIsCreatingBlog(true);

      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('title', title);
      formData.append('content', content);
      formData.append('category_id', category.id);

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await axios.post('http://127.0.0.1:8000/api/create-post', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        present({
          message: 'Blog Created Successfully',
          duration: 3000,
          position: 'top',
        });
        setShowModal(false);
        fetchPosts();
      } else {
        const responseData = response.data;
        if (responseData.errors) {
          const errorMessages = Object.values(responseData.errors).join(', ');
          present({
            message: `Validation Error: ${errorMessages}`,
            duration: 5000,
            position: 'top',
          });
        } else {
          present({
            message: 'Failed to create blog',
            duration: 3000,
            position: 'top',
          });
        }
      }
    } catch (error) {
      console.error('Error creating blog:', error);
      present({
        message: 'Failed to create blog',
        duration: 3000,
        position: 'top',
      });
    } finally {
      setIsCreatingBlog(false);
    }
  }

    const checkForViolations = (text: string): boolean => {
      // Assuming you have a list of violation categories in your state
      const violationCategories = categories.map(cat => cat.name);

      for (const category of violationCategories) {
          if (text.toLowerCase().includes(category.toLowerCase())) {
              return true; // Violation found
          }
      }
      return false; // No violation found
  };


    async function incrementReportCount(userId: number) {
      try {
          const response = await axios.post(`http://127.0.0.1:8000/api/users/${userId}/report`);

          if (response.status === 200) {
              console.log('User report count incremented successfully');
          }
      } catch (error) {
          console.error('Error incrementing report count:', error);
      }
  }


    async function fetchPosts() {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/posts');
        const sortedPosts = [...response.data].sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB.getTime() - dateA.getTime();
        });
        setPosts(sortedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        present({
          message: 'Failed to fetch posts',
          duration: 3000,
          position: 'top',
        });
      }
    }

    const handleEditPost = async (post: any) => {
    try {
      setEditingPost(post);
      setTitle(post.title);
      setContent(post.content);
      setImageFile(null);

      // Fetch category details based on category_id
      if (post.category && post.category.id) {
        const response = await axios.get(`http://127.0.0.1:8000/api/categories/${post.category.id}`);
        const categoryData = response.data[0]; // Assuming the response is an array
        console.log('Fetched Category Data:', categoryData); // Log the fetched category data
        setCategory(categoryData);
      } else {
        setCategory(null); // Reset category if no category ID found
      }

      // Set image URL if available
      if (post.image) {
        setImageFile(post.image);
        console.log('Image URL:', post.image); // Log the image URL for debugging
      }
      

      setShowModal(true); // Open the modal for editing
    } catch (error) {
      console.error('Error handling edit post:', error);
      present({
        message: 'Failed to handle edit post',
        duration: 3000,
        position: 'top',
      });
    }
  };
    
    
    const handleDeletePost = async (post: any) => {
      try {
        const response = await axios.delete(`http://127.0.0.1:8000/api/posts/${post.id}`);

        if (response.status >= 200 && response.status < 300) {
          present({
            message: 'Post Deleted Successfully',
            duration: 3000,
            position: 'top',
          });
          fetchPosts();
        } else {
          present({
            message: 'Failed to delete post',
            duration: 3000,
            position: 'top',
          });
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        present({
          message: 'Failed to delete post',
          duration: 3000,
          position: 'top',
        });
      }
    };

    const handleEditSubmit = async () => {
      try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
    
        // Append category_id if category exists and has an id
        if (category && category.id) {
          formData.append('category_id', category.id);
        }
    
        // Check if the image file has changed
        if (imageFile && imageFile instanceof File) {
          // Append the new image file to the form data
          formData.append('image', imageFile);
        }
    
        const response = await axios.put(`http://127.0.0.1:8000/api/posts/${editingPost.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
    
        if (response.status === 200) {
          present({
            message: 'Post Updated Successfully',
            duration: 3000,
            position: 'top',
          });
          setShowModal(false);
          fetchPosts();
        } else {
          present({
            message: 'Failed to update post',
            duration: 3000,
            position: 'top',
          });
        }
      } catch (error) {
        console.error('Error updating post:', error);
        present({
          message: 'Failed to update post',
          duration: 3000,
          position: 'top',
        });
      }
    };
    
    


    const addComment = async (postId: number) => {
      try {
        const response = await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/comments`, {
          post_id: postId,
          content: commentContent,
          user_id: user.id
        });

        if (response.status === 201) {
          present({
            message: 'Comment Added Successfully',
            duration: 3000,
            position: 'top',
          });
          setCommentContent(''); // Clear the comment content after adding
          fetchPosts(); // Refresh the posts after adding the comment
        } else {
          present({
            message: 'Failed to add comment',
            duration: 3000,
            position: 'top',
          });
        }
      } catch (error) {
        console.error('Error adding comment:', error);
        present({
          message: 'Failed to add comment',
          duration: 3000,
          position: 'top',
        });
      }
    };
    
    
    const handleLogout = () => {
      localStorage.removeItem('user'); // Remove user from local storage
      history.push('/login');
      window.location.reload(); // Force reload of the page
    };

    

    return (
      <IonPage>
        {user && (
          <IonHeader>
            <IonToolbar>
              <IonTitle>Blogging Platform</IonTitle>
              <IonItem lines="none" slot="end">
                <IonButton onClick={(e: any) => setShowPopover({ showPopover: true, event: e.nativeEvent })} className="welcome-button">
                  Welcome, {user.name}
                </IonButton>
                <IonPopover
                  isOpen={popoverState.showPopover}
                  event={popoverState.event}
                  onDidDismiss={() => setShowPopover({ showPopover: false, event: undefined })}
                >
                  <IonList>
                    <IonItem button onClick={handleLogout}>
                      <IonIcon icon={logOutOutline} style={{ color: 'red', marginRight: '8px' }} /> Logout
                    </IonItem>
                  </IonList>
                </IonPopover>
              </IonItem>
            </IonToolbar>
          </IonHeader>
        )}
        {user && (
          <IonContent className="ion-padding">
            <IonList>
              <IonItem>
                <IonButton
                  disabled={isCreatingBlog}
                  onClick={() => {
                    setEditingPost(null);
                    setTitle('');
                    setContent('');
                    setCategory(null);
                    setImageFile(null);
                    setShowModal(true);
                  }}
                >
                  <IonIcon icon={createOutline} style={{ marginRight: '8px' }} /> Create Blog
                </IonButton>
              </IonItem>
            </IonList>
            {posts.map((post, index) => (
              <IonCard key={index}>
                <IonCardHeader>
                  <IonCardTitle>{post.title}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>{post.content}</p>
                  {post.image && <img src={`http://127.0.0.1:8000/${post.image}`} alt="Blog" style={{ width: '100%', maxWidth: '200px' }} />}
                  <IonCardSubtitle>Posted by: {post.user.name}</IonCardSubtitle>
                </IonCardContent>
                {user && user.id === post.user.id && (
                  <IonFooter>
                    <IonButton onClick={() => handleEditPost(post)} style={{ '--background': 'green' }}>
                      <IonIcon icon={pencilOutline} style={{ marginRight: '8px' }} /> Edit
                    </IonButton>
                    <IonButton onClick={() => handleDeletePost(post)} style={{ '--background': 'red' }}>
                      <IonIcon icon={trashOutline} style={{ marginRight: '8px' }} /> Delete
                    </IonButton>
                  </IonFooter>
                )}
                  <IonItem>
                  <IonInput
                    placeholder="Add a comment..."
                    value={commentContent}
                    onIonChange={(e: any) => setCommentContent(e.target.value)}
                  />
                  <IonButton onClick={() => addComment(post.id)}>Add Comment</IonButton>
                </IonItem>
              </IonCard>
            ))}
          </IonContent>
        )}
        
    <IonModal isOpen={showModal && !editingPost}>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Create Blog</IonTitle>
        <IonButton slot="end" onClick={() => setShowModal(false)} color="danger">
          <IonIcon icon={closeCircleOutline} />
        </IonButton>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonList>
        <IonItem>
          <IonInput
            name="title"
            type="text"
            label="Title"
            labelPlacement="floating"
            placeholder="Enter Title"
            value={title}
            onIonChange={(e: any) => setTitle(e.target.value)}
          />
        </IonItem>
        <IonItem>
          <IonInput
            name="content"
            type="text"
            label="Content"
            labelPlacement="floating"
            placeholder="Enter Content"
            value={content}
            onIonChange={(e: any) => setContent(e.target.value)}
          />
        </IonItem>
        <IonItem>
          <IonSelect
            name="category"
            placeholder="Select Category"
            value={category && category.id}
            onIonChange={(e: any) => {
              const selectedCategoryId = e.detail.value;
              const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
              setCategory(selectedCategory);
              fetchCategoryData(selectedCategoryId);
            }}
          >
            {categories.map((cat) => (
              <IonSelectOption key={cat.id} value={cat.id}>
                {cat.name}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
        <IonItem>
          <input type="file" accept="image/*" onChange={(e: any) => setImageFile(e.target.files[0])} />
        </IonItem>
        {imageFile && ( 
          <IonItem>
            <img src={imageFile instanceof File ? URL.createObjectURL(imageFile) : imageFile} alt="Post Image" style={{ width: '100%', maxWidth: '200px' }} />
          </IonItem>
        )}
      </IonList>
      <IonButton onClick={createBlog} expand="full">
        Create Blog
      </IonButton>
    </IonContent>
  </IonModal>

  <IonModal isOpen={showModal && editingPost !== null}>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Edit Post</IonTitle>
        <IonButton slot="end" onClick={() => setShowModal(false)} color="danger">
          <IonIcon icon={closeCircleOutline} />
        </IonButton>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonList>
        <IonItem>
          <IonInput
            name="title"
            type="text"
            label="Title"
            labelPlacement="floating"
            placeholder="Enter Title"
            value={title}
            onIonChange={(e: any) => setTitle(e.target.value)}
          />
        </IonItem>
        <IonItem>
          <IonInput
            name="content"
            type="text"
            label="Content"
            labelPlacement="floating"
            placeholder="Enter Content"
            value={content}
            onIonChange={(e: any) => setContent(e.target.value)}
          />
        </IonItem>
        <IonItem>
          <IonSelect
            name="category"
            placeholder="Select Category"
            value={category && category.id}
            onIonChange={(e: any) => {
              const selectedCategoryId = e.detail.value;
              const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
              setCategory(selectedCategory);
              fetchCategoryData(selectedCategoryId);
            }}
          >
            {categories.map((cat) => (
              <IonSelectOption key={cat.id} value={cat.id}>
                {cat.name}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
        <IonItem>
          <input type="file" accept="image/*" onChange={(e: any) => setImageFile(e.target.files[0])} />
        </IonItem>
        {imageFile && ( 
          <IonItem>
            <img src={imageFile instanceof File ? URL.createObjectURL(imageFile) : imageFile} alt="Post Image" style={{ width: '100%', maxWidth: '200px' }} />
          </IonItem>
        )}
      </IonList>
      <IonButton onClick={handleEditSubmit} expand="full">
        Update Post
      </IonButton>
    </IonContent>
  </IonModal>
      </IonPage>
    );
  };

  export default Dashboard;