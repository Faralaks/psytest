package hendlers

import (
	"context"
	"go.mongodb.org/mongo-driver/bson"
	"net/http"
	"time"
	. "tools"
)

func RefreshMiddleware(cookieRt *http.Cookie, allowList *[]string, w http.ResponseWriter, r *http.Request, next http.Handler) {
	rt := cookieRt.Value
	claims, err := ExtractToken(rt, Config.RefreshSecret)
	if err != nil {
		JsonMsg{Kind: FatalKind, Msg: "Недействительный ключ обновления | " + err.Error()}.SendMsg(w)
		return
	}
	var rtd TokenData
	uid := claims["uid"].(string)
	ctx, _ := context.WithTimeout(context.Background(), 2*time.Second)
	err = TokensCol.FindOne(ctx, bson.M{"_id": uid}).Decode(&rtd)
	if err != nil {
		ctx, _ = context.WithTimeout(context.Background(), 7*time.Second)
		_, _ = TokensCol.DeleteMany(ctx, bson.M{"owner": claims["owner"].(string)})

		DeleteCookie(w)

		JsonMsg{Kind: ReloginKind, Msg: "Скомпрометирован ключ обновления или ключ обновления истек | " + err.Error()}.SendMsg(w)
		return
	}

	ctx, _ = context.WithTimeout(context.Background(), 3*time.Second)
	_, err = TokensCol.DeleteOne(ctx, bson.M{"_id": uid})
	if err != nil {
		VPrint(err.Error())
	}
	newAt, newRt, err := CreateTokens(rtd.Owner, rtd.Status)
	if err != nil {
		JsonMsg{Kind: ReloginKind, Msg: "Не удалось создать новые токены | " + err.Error()}.SendMsg(w)
		return
	}
	http.SetCookie(w, &http.Cookie{Name: "AccessToken", Value: newAt, HttpOnly: true, Expires: time.Now().UTC().Add(Config.ATLifeTime)})
	http.SetCookie(w, &http.Cookie{Name: "RefreshToken", Value: newRt, HttpOnly: true, Expires: time.Now().UTC().Add(Config.RTLifeTime)})

	for _, status := range *allowList {
		if status == rtd.Status {
			r.Header.Set("status", claims["status"].(string))
			r.Header.Set("owner", claims["owner"].(string))

			next.ServeHTTP(w, r)
			return
		}
	}
}
