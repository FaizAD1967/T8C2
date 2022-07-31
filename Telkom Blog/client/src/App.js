import React from "react";
import PostCreate from "./PostCreate";
import PostList from "./PostList";

const App = () => {
  return (
    <div className="container">
      <h1>Telkom Blog Website</h1>
      <hr />
      <hr />
      <h2>You can Create Post Here!</h2>
      <PostCreate />
      <hr />
      <hr />
      <h2>List of Post</h2>
      <PostList />
    </div>
  );
};
export default App;
