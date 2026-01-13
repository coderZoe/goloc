# 第一阶段：编译
FROM golang:1.25-alpine AS builder

WORKDIR /app
# 设置 Go 代理（解决网络问题）
ENV GOPROXY=https://goproxy.cn,https://goproxy.io,direct
# 复制 go.mod 和 go.sum 缓存下载
COPY go.mod go.sum ./
RUN go mod download

# 复制源码
COPY . .

# 静态编译 (禁用 CGO)
RUN CGO_ENABLED=0 GOOS=linux go build -o goloc .

# 第二阶段：运行环境
FROM alpine:latest

# 安装 Git (gocloc 是库，所以不需要安装 scc，但 git 必须有)
RUN apk add --no-cache git

WORKDIR /root/

# 从 builder 拷贝二进制
COPY --from=builder /app/goloc .

# 暴露端口
EXPOSE 8080

# 启动
CMD ["./goloc"]