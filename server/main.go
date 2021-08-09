package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/joho/godotenv"

	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"

	"github.com/gin-contrib/cors"
	//"github.com/buger/jsonparser"
)

type User struct {
	ID   string `json:"id" db:"id"`
	Name string `json:"name" db:"name"`
}

type Comment struct {
	ID          string    `json:"id" db:"id"`
	Time        []float64 `json:"time" db:"time"`
	Text        string    `json:"text" db:"text"`
	WorkspaceId string    `json:"workspaceId" db:"workspace_id"`
}

type MidiMetaData struct {
	Name        string  `json:"name" db:"name"`
	Key         string  `json:"key" db:"key"`
	Scale       string  `json:"scale" db:"scale"`
	PPQ         int     `json:"ppq" db:"ppq"`
	TicksCount  int     `json:"ticksCount" db:"ticks_count"`
	TracksCount int     `json:"tracksCount" db:"tracks_count"`
	BPM         float64 `json:"bpm" db:"bpm"`
}

type Workspace struct {
	ID           string       `json:"id"`
	Name         string       `json:"name"`
	UserID       string       `json:"userId"`
	Comments     []Comment    `json:"comments"`
	UpdateTime   time.Time    `json:"updateTime"`
	CreateTime   time.Time    `json:"createTime"`
	MidiMetaData MidiMetaData `json:"midiMetaData"`
}

var localUserDatabases = []User{}

var createUserTableQuery string = `
	CREATE TABLE IF NOT EXISTS midi_app_users(
        id		VARCHAR(36)		PRIMARY KEY,
        name    VARCHAR(1024) 	NOT NULL
    );`

var createWorkspacesTableQuery string = `
	CREATE TABLE IF NOT EXISTS midi_app_workspaces(
        id				VARCHAR(36)		PRIMARY KEY,
        name    		VARCHAR(1024) 	NOT NULL,
		user_id			VARCHAR(36)		NOT NULL,
		comments    	JSONB[] 		NOT NULL,
		update_time 	TIMESTAMP 		NOT NULL,
		create_time 	TIMESTAMP 		NOT NULL,
		midi_meta_data  JSONB			NOT NULL	
    );`

var createCommentsTableQuery string = `
	CREATE TABLE IF NOT EXISTS midi_app_comments(
        id				VARCHAR(36)		PRIMARY KEY,
        time    		NUMERIC[] 		NOT NULL,
		text			TEXT			NOT NULL,
		workspace_id	VARCHAR(36)		NOT NULL
    );`

func main() {

	//load .env file
	if os.Getenv("APP_ENV") != "production" {
		fmt.Println("develop ON!")
		loadEnvErr := godotenv.Load(".env")
		if loadEnvErr != nil {
			log.Fatalf("Error loading .env file")
			os.Exit(1)
		}
	}

	//retrieve database connection string
	databaseURI := os.Getenv("DATABASE_URL")
	sessionKey := os.Getenv("SESSION_KEY")

	//session
	key := sessionKey
	maxAge := 86400 * 30                           // 30 days
	isProd := os.Getenv("APP_ENV") == "production" // Set to true when serving over https

	store := sessions.NewCookieStore([]byte(key))

	store.MaxAge(maxAge)

	sameSiteSetting := http.SameSiteLaxMode
	if os.Getenv("APP_ENV") == "production" {
		sameSiteSetting = http.SameSiteNoneMode
	}

	store.Options.Path = "/"
	store.Options.HttpOnly = true // HttpOnly should always be enabled
	store.Options.Secure = isProd
	store.Options.SameSite = sameSiteSetting
	store.Options.MaxAge = maxAge

	gothic.Store = store
	//

	callbackUrl := "http://localhost:8080/api/auth/google/callback"
	if os.Getenv("APP_ENV") == "production" {
		callbackUrl = os.Getenv("PRODUCTION_SERVER_URL") + "/api/auth/google/callback"
	}

	clientUrl := "http://localhost:3000"
	if os.Getenv("APP_ENV") == "production" {
		clientUrl = os.Getenv("PRODUCTION_CLIENT_URL")
	}

	googleProvider := google.New(os.Getenv("CLIENT_ID"), os.Getenv("CLIENT_SECRET"), callbackUrl, "email", "profile")
	goth.UseProviders(googleProvider)

	//connect to postgres database
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, databaseURI)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	//thread safe version (for many queries in short intervals)
	config, err := pgxpool.ParseConfig(databaseURI)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database with pgxpool: %v\n", err)
		os.Exit(1)
	}
	pool, err := pgxpool.ConnectConfig(context.Background(), config)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Pool error:  %v\n", err)
		os.Exit(1)
	}

	//table creation if they don't exist
	_, err = conn.Exec(ctx, createUserTableQuery)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to create users table: %v\n", err)
		os.Exit(1)
	}

	_, err = conn.Exec(ctx, createCommentsTableQuery)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to create comments table: %v\n", err)
		os.Exit(1)
	}

	_, err = conn.Exec(ctx, createWorkspacesTableQuery)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to create workspaces table: %v\n", err)
		os.Exit(1)
	}

	//gin
	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", os.Getenv("PRODUCTION_CLIENT_URL")},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "OPTIONS", "DELETE"},
		AllowHeaders:     []string{"Access-Control-Allow-Credentials", "Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	//api routes
	api := router.Group("/api")

	// api.GET("/", apiRoot)

	api.GET("/users", getUsers)
	api.POST("/user", postUser)

	api.GET("/workspaces", GetWorkspaceHandler(ctx, conn))
	api.POST("/workspace", PostWorkspaceHandler(ctx, conn, store))
	api.DELETE("/workspace", DeleteWorkspaceHandler(ctx, pool, store))

	api.GET("/comments", GetCommentHandler(ctx, conn))
	api.POST("/comment", PostCommentHandler(ctx, conn))
	api.PATCH("/comment", PatchCommentHandler(ctx, pool, store))
	api.DELETE("/comment", DeleteCommentHandler(ctx, pool, store))

	api.GET("/userWorkspaces", GetUserWorkspaceHandler(ctx, pool, store))

	htmlFormat := `<html><body>%v</body></html>`
	router.GET("/", func(c *gin.Context) {
		html := fmt.Sprintf(htmlFormat, `<a href="api/google">Login through google</a>`)
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
	})

	api.GET("/auth/google", func(c *gin.Context) {
		q := c.Request.URL.Query()
		q.Add("provider", "google")
		c.Request.URL.RawQuery = q.Encode()
		gothic.BeginAuthHandler(c.Writer, c.Request)
	})

	api.GET("/auth/google/callback", func(c *gin.Context) {
		q := c.Request.URL.Query()
		q.Add("provider", "google")
		c.Request.URL.RawQuery = q.Encode()
		user, err := gothic.CompleteUserAuth(c.Writer, c.Request)
		if err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
		// res, err := json.Marshal(user)
		// if err != nil {
		// 	c.AbortWithError(http.StatusInternalServerError, err)
		// 	return
		// }
		// jsonString := string(res)

		session, err := store.Get(c.Request, "google-session")
		if err != nil {
			c.AbortWithError(http.StatusNotFound, err) //change error later
			return
		}

		// Set some session values.
		fmt.Println(session.Values["google_id"])

		if session.Values["google_id"] == nil || session.Values["google_id"] == "" { //doesn't exist
			session.Values["name"] = user.Name
			session.Values["email"] = user.Email
			session.Values["google_id"] = user.UserID
		}

		err = session.Save(c.Request, c.Writer)

		if err != nil {
			http.Error(c.Writer, err.Error(), http.StatusInternalServerError)
			return
		}

		// html := fmt.Sprintf(htmlFormat, jsonString)
		// c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))

		http.Redirect(c.Writer, c.Request, clientUrl, http.StatusPermanentRedirect)
	})

	api.GET("/logout", func(c *gin.Context) {

		session, err := store.Get(c.Request, "google-session")
		if err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
		}

		fmt.Println("log out")

		err = session.Save(c.Request, c.Writer)
		if err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
		}

		//save again after max age is <= 0; this seems potentially buggy
		session.Options.MaxAge = -1
		err = session.Save(c.Request, c.Writer)
		if err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
		}

		http.Redirect(c.Writer, c.Request, clientUrl, http.StatusFound)

	})

	api.GET("/authenticate", func(c *gin.Context) {
		session, err := store.Get(c.Request, "google-session")
		if err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
		}

		name := session.Values["name"]

		fmt.Println(session.Values["name"])
		fmt.Println(session.Values["email"])
		fmt.Println(session.Values["google_id"])

		if session.Values["google_id"] != nil && session.Values["google_id"] != "" {
			c.IndentedJSON(http.StatusOK, name)
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    http.StatusUnauthorized,
				"message": "User not logged in", // cast it to string before showing
			})
		}
	})

	router.Run()
	fmt.Println("Running server...")
}

func getUsers(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, localUserDatabases)
}

func GetWorkspaceHandler(ctx context.Context, conn *pgx.Conn) gin.HandlerFunc {
	fn := func(c *gin.Context) {

		rows, err := conn.Query(context.Background(), "SELECT * FROM midi_app_workspaces;")
		if err != nil {
			log.Fatal(err)
			c.String(400, err.Error())
		}
		defer rows.Close()

		var commentSlice []Workspace = make([]Workspace, 0)
		for rows.Next() {
			var workspace Workspace
			err := rows.Scan(&workspace.ID, &workspace.Name, &workspace.UserID, &workspace.Comments, &workspace.UpdateTime, &workspace.CreateTime, &workspace.MidiMetaData)
			if err != nil {
				log.Fatal(err)
				c.String(400, err.Error())
			}
			commentSlice = append(commentSlice, workspace)
		}
		if err := rows.Err(); err != nil {
			log.Fatal(err)
			c.String(400, err.Error())
		}

		fmt.Println(commentSlice)

		c.IndentedJSON(http.StatusOK, commentSlice)

	}
	return gin.HandlerFunc(fn)
}

func GetUserWorkspaceHandler(ctx context.Context, conn *pgxpool.Pool, store *sessions.CookieStore) gin.HandlerFunc {
	fn := func(c *gin.Context) {

		session, err := store.Get(c.Request, "google-session")
		if err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
		}

		userId := session.Values["google_id"]
		if userId == nil || userId == "" { //not authenticated
			c.AbortWithError(http.StatusInternalServerError, err)
		}

		rows, err := conn.Query(context.Background(), "SELECT * FROM midi_app_workspaces WHERE user_id=$1;", userId)
		if err != nil {
			log.Fatal(err)
			c.String(400, err.Error())
		}
		defer rows.Close()

		var workspaceSlice []Workspace = make([]Workspace, 0)
		for rows.Next() {
			var workspace Workspace
			err := rows.Scan(&workspace.ID, &workspace.Name, &workspace.UserID, &workspace.Comments, &workspace.UpdateTime, &workspace.CreateTime, &workspace.MidiMetaData)

			if err != nil {
				log.Fatal(err)
				c.String(400, err.Error())
			}

			commentRows, err := conn.Query(context.Background(), "SELECT * FROM midi_app_comments WHERE workspace_id=$1;", workspace.ID)
			if err != nil {
				log.Fatal(err)
				c.String(400, err.Error())
			}
			defer commentRows.Close()

			var commentSlice []Comment = make([]Comment, 0)
			for commentRows.Next() {
				var comment Comment
				err := commentRows.Scan(&comment.ID, &comment.Time, &comment.Text, &comment.WorkspaceId)

				if err != nil {
					log.Fatal(err)
					c.String(400, err.Error())
				}
				commentSlice = append(commentSlice, comment)
			}

			workspace.Comments = commentSlice

			workspaceSlice = append(workspaceSlice, workspace)
		}
		if err := rows.Err(); err != nil {
			log.Fatal(err)
			c.String(400, err.Error())
		}

		c.IndentedJSON(http.StatusOK, workspaceSlice)

	}
	return gin.HandlerFunc(fn)
}

func PostWorkspaceHandler(ctx context.Context, conn *pgx.Conn, store *sessions.CookieStore) gin.HandlerFunc {

	type NewWorkspace struct {
		ID           string       `json:"id"`
		Name         string       `json:"name"`
		MidiMetaData MidiMetaData `json:"midiMetaData"`
	}

	fn := func(c *gin.Context) {

		var newWorkspace NewWorkspace

		if err := c.BindJSON(&newWorkspace); err != nil {
			fmt.Println(err.Error())
			return
		}

		session, err := store.Get(c.Request, "google-session")
		if err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
		}

		fmt.Println(session.Values["name"])
		fmt.Println(session.Values["email"])
		fmt.Println(session.Values["google_id"])

		// db
		_, err = conn.Exec(ctx, "INSERT INTO midi_app_workspaces(id, name, user_id, comments, update_time, create_time, midi_meta_data) values ($1, $2, $3, $4, $5, $6, $7);",
			newWorkspace.ID,
			newWorkspace.Name,
			session.Values["google_id"],
			make([]Comment, 0),
			time.Now(),
			time.Now(),
			newWorkspace.MidiMetaData)
		if err != nil {
			fmt.Println(err.Error())
			return
		}

		c.IndentedJSON(http.StatusCreated, newWorkspace)
	}
	return gin.HandlerFunc(fn)
}

func DeleteWorkspaceHandler(ctx context.Context, conn *pgxpool.Pool, store *sessions.CookieStore) gin.HandlerFunc {

	type DeleteQuery struct {
		ID string `json:"id"`
	}

	fn := func(c *gin.Context) {

		var deleteQuery DeleteQuery

		if err := c.BindJSON(&deleteQuery); err != nil {
			fmt.Println(err.Error())
			return
		}

		//validate if workspace belongs to currently logged in user
		session, err := store.Get(c.Request, "google-session")
		if err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
		}

		userId := session.Values["google_id"]
		if userId == nil || userId == "" { //not authenticated
			c.AbortWithError(http.StatusInternalServerError, err)
		}

		commentRows, err := conn.Query(context.Background(), "SELECT * FROM midi_app_workspaces WHERE user_id=$1 AND id=$2;", userId, deleteQuery.ID)
		if err != nil {
			log.Fatal(err)
			c.String(400, err.Error())
		}
		defer commentRows.Close()

		counter := 0
		for commentRows.Next() {
			counter++
		}

		fmt.Println("counter")
		fmt.Println(counter)

		if counter <= 0 {
			log.Fatal(err)
			c.String(400, "User has no access to the workspace")
		}

		// db
		//first delete the workspace itself
		_, err = conn.Exec(ctx, "DELETE FROM midi_app_workspaces WHERE id=$1", deleteQuery.ID)
		if err != nil {
			c.String(400, err.Error())
		}

		//then delete the comments that were part of the workspace
		_, err = conn.Exec(ctx, "DELETE FROM midi_app_comments WHERE workspace_id=$1", deleteQuery.ID)
		if err != nil {
			c.String(400, err.Error())
		}

		c.IndentedJSON(http.StatusCreated, "Workspace "+deleteQuery.ID+" deleted")
	}
	return gin.HandlerFunc(fn)
}

func DeleteCommentHandler(ctx context.Context, conn *pgxpool.Pool, store *sessions.CookieStore) gin.HandlerFunc {

	type DeleteQuery struct {
		ID          string `json:"id"`
		WorkspaceId string `json:"workspaceId"`
	}

	fn := func(c *gin.Context) {

		var deleteQuery DeleteQuery

		if err := c.BindJSON(&deleteQuery); err != nil {
			fmt.Println(err.Error())
			return
		}

		//validate if workspace belongs to currently logged in user
		session, err := store.Get(c.Request, "google-session")
		if err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
		}

		userId := session.Values["google_id"]
		if userId == nil || userId == "" { //not authenticated
			c.AbortWithError(http.StatusInternalServerError, err)
		}

		commentRows, err := conn.Query(context.Background(), "SELECT * FROM midi_app_workspaces WHERE user_id=$1 AND id=$2;", userId, deleteQuery.WorkspaceId)
		if err != nil {
			log.Fatal(err)
			c.String(400, err.Error())
		}
		defer commentRows.Close()

		counter := 0
		for commentRows.Next() {
			counter++
		}

		fmt.Println("counter")
		fmt.Println(counter)

		if counter <= 0 {
			log.Fatal(err)
			c.String(400, "User has no access to the workspace")
		}

		// db
		_, err = conn.Exec(ctx, "DELETE FROM midi_app_comments WHERE id=$1 AND workspace_id=$2", deleteQuery.ID, deleteQuery.WorkspaceId)
		if err != nil {
			c.String(400, err.Error())
		}

		c.IndentedJSON(http.StatusCreated, "Comment "+deleteQuery.ID+" deleted")
	}
	return gin.HandlerFunc(fn)
}

func PatchCommentHandler(ctx context.Context, conn *pgxpool.Pool, store *sessions.CookieStore) gin.HandlerFunc {

	type UpdateQuery struct {
		ID             string `json:"id"`
		WorkspaceId    string `json:"workspaceId"`
		NewCommentText string `json:"text"`
	}

	fn := func(c *gin.Context) {

		var updateQuery UpdateQuery

		if err := c.BindJSON(&updateQuery); err != nil {
			fmt.Println(err.Error())
			return
		}

		//validate if workspace belongs to currently logged in user
		session, err := store.Get(c.Request, "google-session")
		if err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
		}

		userId := session.Values["google_id"]
		if userId == nil || userId == "" { //not authenticated
			c.AbortWithError(http.StatusInternalServerError, err)
		}

		commentRows, err := conn.Query(context.Background(), "SELECT * FROM midi_app_workspaces WHERE user_id=$1 AND id=$2;", userId, updateQuery.WorkspaceId)
		if err != nil {
			log.Fatal(err)
			c.String(400, err.Error())
		}
		defer commentRows.Close()

		counter := 0
		for commentRows.Next() {
			counter++
		}

		if counter <= 0 {
			log.Fatal(err)
			c.String(400, "User has no access to the workspace")
		}

		// db
		_, err = conn.Exec(ctx, "UPDATE midi_app_comments SET text=$1 WHERE id=$2", updateQuery.NewCommentText, updateQuery.ID)
		if err != nil {
			c.String(400, err.Error())
		}

		c.IndentedJSON(http.StatusCreated, "Comment "+updateQuery.ID+" deleted")
	}
	return gin.HandlerFunc(fn)
}

func GetCommentHandler(ctx context.Context, conn *pgx.Conn) gin.HandlerFunc {
	fn := func(c *gin.Context) {

		rows, err := conn.Query(context.Background(), "SELECT * FROM midi_app_comments;")
		if err != nil {
			log.Fatal(err)
			c.String(400, err.Error())
		}
		defer rows.Close()

		var commentSlice []Comment = make([]Comment, 0)
		for rows.Next() {
			var comment Comment
			err := rows.Scan(&comment.ID, &comment.Time, &comment.Text, &comment.WorkspaceId)
			if err != nil {
				log.Fatal(err)
				c.String(400, err.Error())
			}
			commentSlice = append(commentSlice, comment)
		}
		if err := rows.Err(); err != nil {
			log.Fatal(err)
			c.String(400, err.Error())
		}

		fmt.Println(commentSlice)

		c.IndentedJSON(http.StatusOK, commentSlice)

	}
	return gin.HandlerFunc(fn)
}

func PostCommentHandler(ctx context.Context, conn *pgx.Conn) gin.HandlerFunc {
	fn := func(c *gin.Context) {

		var newComment Comment

		if err := c.BindJSON(&newComment); err != nil {
			fmt.Println(err.Error())
			return
		}

		// db
		_, err := conn.Exec(ctx, "INSERT INTO midi_app_comments(id, time, text, workspace_id) values ($1, $2, $3, $4);", newComment.ID, newComment.Time, newComment.Text, newComment.WorkspaceId)
		if err != nil {
			fmt.Println(err.Error())
			return
		}

		c.IndentedJSON(http.StatusCreated, newComment)

	}

	return gin.HandlerFunc(fn)
}

func postUser(c *gin.Context) {
	var newUser User

	if err := c.BindJSON(&newUser); err != nil {
		return
	}

	localUserDatabases = append(localUserDatabases, newUser)
	c.IndentedJSON(http.StatusCreated, localUserDatabases)
}
