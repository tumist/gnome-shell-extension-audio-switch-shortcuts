NAME=audio-switch-shortcuts
DOMAIN=dbatis.github.com


.PHONY: all compile compile_schema pack install clean

all: compile

node_modules: package.json
	npm install

compile: node_modules
	tsc

compile_schema: schemas/com.github.dbatis.audio-switch-shortcuts.gschema.xml
	glib-compile-schemas --strict schemas

pack: compile compile_schema
	@cp -r schemas dist/
	@cp metadata.json dist/
	@(cd dist && zip $(NAME).zip -9r .)

install: pack
	@touch ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	@rm -rf ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	@cp -rf dist ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)

clean:
	@rm -rf dist $(NAME).zip gschemas/gschemas.compiled

