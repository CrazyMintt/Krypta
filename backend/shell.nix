let
    pkgs = import <nixpkgs> {}; # Or pin a specific nixpkgs commit for reproducibility
in
    pkgs.mkShell {
        packages = [
          (pkgs.python3.withPackages (python-pkgs: with python-pkgs; [
            requests
            fastapi[standard]
          ]))
        ];
      }