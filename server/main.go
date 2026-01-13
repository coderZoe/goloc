package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

var appConfig *AppConfig
var cache *SafeCache

func main() {
	appConfig = NewAppConfig()

	cache = NewCache(10 * time.Minute)
	mux := http.NewServeMux()
	mux.HandleFunc("/api/analyze", handleAnalyze)
	mux.HandleFunc("/api/config", handleConfig)
	corsHandler := corsMiddleware(mux)

	finalHandler := recoveryMiddleware(corsHandler)
	port := ":8080"
	fmt.Printf("GoLoc server started on %s\n", port)

	if err := http.ListenAndServe(port, finalHandler); err != nil {
		log.Fatal(err)
	}
}
