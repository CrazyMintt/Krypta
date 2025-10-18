let
  pkgs = import <nixpkgs> { };
in
pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    # Backend
    (pkgs.python3.withPackages 
      (python-pkgs: with python-pkgs; 
        [
          requests
          fastapi[standard]
          uvicorn
          sqlalchemy
          python-dotenv
	  pymysql
        ]
      )
    )
    

    # Frontend
    pkg-config
    gobject-introspection
    cargo 
    cargo-tauri # Optional, Only needed if Tauri doesn't work through the traditional way.
    nodejs # Optional, this is for if you have a js frontend
  ];

  buildInputs = with pkgs;[
    at-spi2-atk
    atkmm
    cairo
    gdk-pixbuf
    glib
    gtk3
    harfbuzz
    librsvg
    libsoup_3
    pango
    webkitgtk_4_1
    openssl
  ];
  # shellHook = "";
}
